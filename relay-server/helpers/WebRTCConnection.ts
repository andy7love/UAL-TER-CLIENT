import Configuration from '../managers/Configuration';

interface INodeWebRTC {
	RTCPeerConnection: new (configuration: RTCConfiguration) => RTCPeerConnection;
	RTCSessionDescription: new (descriptionInitDict?: RTCSessionDescriptionInit) => RTCSessionDescription;
	RTCIceCandidate: new (candidateInitDict?: RTCIceCandidate) => RTCIceCandidate;
}

interface IWebRTCConnectionSettings {
	events: {
		connected: () => void,
		disconnected: () => void,
		readyToSend: (ready: boolean) => void,
		reliableMessageReceived: (data: string) => void
		fastMessageReceived: (data: string) => void
	};
}

interface IWebRTCChannel {
	label: string;
	channel?: RTCDataChannel;
	configuration: RTCDataChannelInit;
}

interface IClientChannels {
	reliable: IWebRTCChannel;
	fast: IWebRTCChannel;
}

export class WebRTCConnection {
	public static SignalingEvents = {
		clientConnected: 'client-connected',
		droneConnected: 'drone-connected',
		droneConnect: 'drone-connect',
		messageToClient: 'message-to-client',
		messageToDrone: 'message-to-drone'
	};
	public static SignalingPeerMessages = {
		answer: 'answer',
		candidate: 'candidate',
		disconnect: 'disconnect'
	};
	private channels: IClientChannels = {
		reliable: {
			label: 'drone-reliable-channel',
			configuration: {
				ordered: true,
				maxRetransmits: 100
			}
		},
		fast: {
			label: 'drone-fast-channel',
			configuration: {
				ordered: false,
				maxRetransmits: 0
			}
		}
	};
	private webrtc: INodeWebRTC;
	private signalingServerURL: string = Configuration.communication.relaySignalingServer;
	private socket: SocketIOClient.Socket;
	private peerConnection: RTCPeerConnection = null;
	private isPeerConnectionStarted: boolean = false;
	private settings: IWebRTCConnectionSettings;

	constructor(settings: IWebRTCConnectionSettings) {
		this.webrtc = require('wrtc');
		this.settings = settings;
	}

	public connect(): void {
		this.socket = require('socket.io-client')(this.signalingServerURL);
		this.socket.on(WebRTCConnection.SignalingEvents.droneConnected, () => {
			console.log('Warning! another drone was connected! I will not receive more signaling messages. Disconnecting...');
			this.closeConnection();
		});
		this.socket.on(WebRTCConnection.SignalingEvents.messageToDrone, (message: any) => {
			this.handleMessageToDrone(message);
		});
		this.socket.emit(WebRTCConnection.SignalingEvents.droneConnect);
	}

	public disconnect() {
		this.sendMessageToClient(WebRTCConnection.SignalingPeerMessages.disconnect);
		this.closeConnection();
	}

	public isReadyToSend(): boolean {
		return (this.isPeerConnectionStarted &&
			this.channels.reliable.channel.readyState === 'open');
	}

	public sendDataUsingReliableChannel(data: any) {
		if (typeof data !== 'string') {
			data = JSON.stringify(data);
		}
		if (this.isReadyToSend()) {
			this.channels.reliable.channel.send(data);
		} else {
			console.warn('Reliable channel not ready to send data! - data lost');
		}
	}

	public sendDataUsingFastChannel(data: any) {
		if (typeof data !== 'string') {
			data = JSON.stringify(data);
		}
		if (this.isPeerConnectionStarted && this.channels.fast.channel.readyState === 'open') {
			this.channels.fast.channel.send(data);
		}
	}

	private sendMessageToClient(message: any): void {
		this.socket.emit(WebRTCConnection.SignalingEvents.messageToClient, message);
	}

	private handleMessageToDrone(message: any): void {
		if (message.type === 'offer') {
			if (this.isPeerConnectionStarted) {
				console.log('new client! replace connection.');
				this.closeWebRTCConnection();
			}
			this.answerOffer(new this.webrtc.RTCSessionDescription(message));
		} else if (!this.isPeerConnectionStarted) {
			this.initConnection(message);
		}
	}

	private initConnection(message: any) {
		if (message.type === WebRTCConnection.SignalingPeerMessages.candidate) {
			const candidate = new RTCIceCandidate({
				sdpMLineIndex: message.label,
				candidate: message.candidate
			});
			if (this.peerConnection) {
				this.peerConnection.addIceCandidate(candidate);
			}
		} else if (message === WebRTCConnection.SignalingPeerMessages.disconnect) {
			this.closeConnection();
		}
	}

	private answerOffer(remoteDescription: RTCSessionDescription): void {
		if (!this.isPeerConnectionStarted) {
			this.createPeerConnection();
			this.isPeerConnectionStarted = true;
			this.peerConnection.setRemoteDescription(remoteDescription);
			this.peerConnection.createAnswer(sessionDescription => {
				this.peerConnection.setLocalDescription(sessionDescription);
				this.sendMessageToClient(sessionDescription);
				this.settings.events.connected();
			}, error => {
				console.log('createAnswer() error: ', error.toString());
			});
		}
	}

	private createPeerConnection(): void {
		try {
			this.peerConnection = new this.webrtc.RTCPeerConnection(null);
			this.peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
				this.handleIceCandidate(event);
			};
			// pc.onaddstream = handleRemoteStreamAdded;
			// pc.onremovestream = handleRemoteStreamRemoved;
			this.peerConnection.ondatachannel = event => {
				this.handleIncomingChannels(event);
			};
			console.log('Created RTCPeerConnnection');
			this.createReliableDataChannel();
			this.createFastDataChannel();
		} catch (e) {
			console.log('Failed to create PeerConnection, exception: ' + e.message);
			return;
		}
	}

	private createReliableDataChannel() {
		const newChannel: RTCDataChannel = this.peerConnection.createDataChannel(
			this.channels.reliable.label,
			this.channels.reliable.configuration
		);
		newChannel.onopen = () => {
			this.handleReliableChannelStateChange();
		};
		newChannel.onclose = () => {
			this.handleReliableChannelStateChange();
		};
		this.channels.reliable.channel = newChannel;
	}

	private createFastDataChannel() {
		const newChannel = this.peerConnection.createDataChannel(
			this.channels.fast.label,
			this.channels.fast.configuration
		);
		this.channels.fast.channel = newChannel;
	}

	private handleIncomingChannels(event: any) {
		const receiveChannel: any = event.channel;

		switch (receiveChannel.label) {
			case 'client-reliable-channel':
				receiveChannel.onmessage = (messageEvent: MessageEvent) => {
					this.receiveReliableMessage(messageEvent);
				};
				break;
			case 'client-fast-channel':
				receiveChannel.onmessage = (messageEvent: MessageEvent) => {
					this.receiveFastMessage(messageEvent);
				};
				break;
			default:
				console.error('Unkown data channel label received. ', receiveChannel.label);
				break;
		}
	}

	private receiveReliableMessage(event: MessageEvent) {
		const data = event.data;
		this.settings.events.reliableMessageReceived(data);
	}

	private receiveFastMessage(event: MessageEvent) {
		const data = event.data;
		this.settings.events.fastMessageReceived(data);
	}

	private handleReliableChannelStateChange() {
		const readyToSend = this.isReadyToSend();
		this.settings.events.readyToSend(readyToSend);
	}

	private handleIceCandidate(event: RTCPeerConnectionIceEvent) {
		if (event.candidate) {
			this.sendMessageToClient({
				type: 'candidate',
				label: event.candidate.sdpMLineIndex,
				id: event.candidate.sdpMid,
				candidate: event.candidate.candidate
			});
		}
	}

	private closeWebRTCConnection() {
		this.isPeerConnectionStarted = false;
		if (this.peerConnection !== null) {
			this.peerConnection.close();
			this.peerConnection = null;
		}
	}

	private closeConnection() {
		this.closeWebRTCConnection();
		this.socket.removeAllListeners();
		this.socket.close();
		this.settings.events.disconnected();
	}
}
