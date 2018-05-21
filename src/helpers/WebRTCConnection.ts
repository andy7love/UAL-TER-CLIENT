interface IWebRTCConnectionSettings {
	events: {
		connected: () => void,
		disconnected: () => void,
		readyToSend: (ready: boolean) => void,
		messageReceived: (data: string) => void
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
		clientConnect: 'client-connect',
		clientConnected: 'client-connected',
		droneConnected: 'drone-connected',
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
			label: 'client-reliable-channel',
			configuration: {
				ordered: true,
				maxRetransmits: 100
			}
		},
		fast: {
			label: 'client-fast-channel',
			configuration: {
				ordered: false,
				maxRetransmits: 0
			}
		}
	};
	private signalingServerURL: string = 'http://localhost:8080';
	private socket: SocketIOClient.Socket;
	private peerConnection: RTCPeerConnection;
	private isPeerConnectionStarted: boolean = false;
	private settings: IWebRTCConnectionSettings;

	constructor(settings: IWebRTCConnectionSettings) {
		this.settings = settings;
	}

	public connect(): void {
		this.socket = io.connect(this.signalingServerURL);
		this.socket.on(WebRTCConnection.SignalingEvents.clientConnected, () => {
			console.log('Warning! another client was connected! I will not receive more signaling messages. Disconnecting...');
			this.closeConnection();
		});
		this.socket.on(WebRTCConnection.SignalingEvents.droneConnected, () => {
			if (this.isPeerConnectionStarted) {
				console.log('new drone! replace connection.');
				this.closeConnection();
			}
			this.startPeerConnection();
		});
		this.socket.on(WebRTCConnection.SignalingEvents.messageToClient, (message: any) => {
			this.handleMessageToClient(message);
		});
		window.onbeforeunload = () => {
			this.sendMessageToDrone(WebRTCConnection.SignalingPeerMessages.disconnect);
		};
		this.socket.emit(WebRTCConnection.SignalingEvents.clientConnect);
	}

	public disconnect() {
		this.sendMessageToDrone(WebRTCConnection.SignalingPeerMessages.disconnect);
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
			console.log('Warning! Reliable channel not ready to send data! - data lost');
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

	private sendMessageToDrone(message: any): void {
		this.socket.emit(WebRTCConnection.SignalingEvents.messageToDrone, message);
	}

	private handleMessageToClient(message: any): void {
		if (!this.isPeerConnectionStarted) {
			return;
		}

		if (message.type === WebRTCConnection.SignalingPeerMessages.answer) {
			this.peerConnection.setRemoteDescription(new RTCSessionDescription(message));
		} else if (message.type === WebRTCConnection.SignalingPeerMessages.candidate) {
			const candidate = new RTCIceCandidate({
				sdpMLineIndex: message.label,
				candidate: message.candidate
			});
			this.peerConnection.addIceCandidate(candidate);
		} else if (message === WebRTCConnection.SignalingPeerMessages.disconnect) {
			this.closeConnection();
		}
	}

	private startPeerConnection(): void {
		if (!this.isPeerConnectionStarted) {
			console.log('P2P: Connecting...');
			this.createPeerConnection();
			this.isPeerConnectionStarted = true;
			this.peerConnection.createOffer(sessionDescription => {
				this.peerConnection.setLocalDescription(sessionDescription);
				this.sendMessageToDrone(sessionDescription);
				this.settings.events.connected();
			}, error => {
				console.log('createOffer() error: ', error.toString());
			});
		}
	}

	private createPeerConnection(): void {
		try {
			this.peerConnection = new RTCPeerConnection(null);
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

	private handleIncomingChannels(event: RTCDataChannelEvent) {
		const receiveChannel: RTCDataChannel = event.channel;
		receiveChannel.onmessage = (messageEvent: MessageEvent) => {
			this.receiveMessage(messageEvent);
		};
	}

	private receiveMessage(event: MessageEvent) {
		const data = event.data;
		this.settings.events.messageReceived(data);
	}

	private handleReliableChannelStateChange() {
		const readyToSend = this.isReadyToSend();
		this.settings.events.readyToSend(readyToSend);
	}

	private handleIceCandidate(event: RTCPeerConnectionIceEvent) {
		if (event.candidate) {
			this.sendMessageToDrone({
				type: 'candidate',
				label: event.candidate.sdpMLineIndex,
				id: event.candidate.sdpMid,
				candidate: event.candidate.candidate
			});
		}
	}

	private closeConnection() {
		console.log('P2P: Closing connection...');
		this.isPeerConnectionStarted = false;
		if (this.peerConnection !== null) {
			this.peerConnection.close();
			this.peerConnection = null;
		}
		this.settings.events.disconnected();
	}
}
