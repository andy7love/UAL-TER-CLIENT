import Configuration from '../managers/Configuration';

interface NodeWebRTC {
    RTCPeerConnection: new (configuration: RTCConfiguration) => RTCPeerConnection,
    RTCSessionDescription: new (descriptionInitDict?: RTCSessionDescriptionInit) => RTCSessionDescription,
    RTCIceCandidate: new (candidateInitDict?: RTCIceCandidate) => RTCIceCandidate
}

interface WebRTCConnectionSettings {
    events: {
        connected: () => void,
        disconnected: () => void,
        readyToSend: (ready: boolean) => void,
        reliableMessageReceived: (data: string) => void
        fastMessageReceived: (data: string) => void
    }
}

interface WebRTCChannel {
    label: string,
    channel?: RTCDataChannel,
    configuration: RTCDataChannelInit
}

interface ClientChannels {
    reliable: WebRTCChannel,
    fast: WebRTCChannel
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
    private channels: ClientChannels = {
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
    private webrtc: NodeWebRTC;
    private signalingServerURL: string = Configuration.communication.relaySignalingServer;
    private socket:SocketIOClient.Socket;
    private peerConnection: RTCPeerConnection = null;
    private isPeerConnectionStarted: boolean = false;
    private settings: WebRTCConnectionSettings;

    constructor(settings: WebRTCConnectionSettings) {
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

    private sendMessageToClient(message: any): void {
        this.socket.emit(WebRTCConnection.SignalingEvents.messageToClient, message);
    }

    private handleMessageToDrone(message: any): void {
        if (message.type === 'offer') {
            if(this.isPeerConnectionStarted) {
                console.log('new client! replace connection.');
                this.closeWebRTCConnection();
            }
            this.answerOffer(new this.webrtc.RTCSessionDescription(message));
        } else if(!this.isPeerConnectionStarted) {
            if (message.type === WebRTCConnection.SignalingPeerMessages.candidate) {
                var candidate = new RTCIceCandidate({
                    sdpMLineIndex: message.label,
                    candidate: message.candidate
                })
                if(this.peerConnection) {
                    this.peerConnection.addIceCandidate(candidate);
                }
            } else if (message === WebRTCConnection.SignalingPeerMessages.disconnect) {
                this.closeConnection();
            }
        }
    }

    private answerOffer(remoteDescription: RTCSessionDescription): void {
        if (!this.isPeerConnectionStarted) {
            this.createPeerConnection();
            this.isPeerConnectionStarted = true;
            this.peerConnection.setRemoteDescription(remoteDescription);
            this.peerConnection.createAnswer((sessionDescription) => {
                this.peerConnection.setLocalDescription(sessionDescription);
                this.sendMessageToClient(sessionDescription);
                this.settings.events.connected();
            }, (error) => {
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
            //pc.onaddstream = handleRemoteStreamAdded;
            //pc.onremovestream = handleRemoteStreamRemoved;
            this.peerConnection.ondatachannel = (event) => {
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
        let newChannel: RTCDataChannel = this.peerConnection.createDataChannel(this.channels.reliable.label, this.channels.reliable.configuration);
        newChannel.onopen = () => {
            this.handleReliableChannelStateChange();
        };
        newChannel.onclose = () => {
            this.handleReliableChannelStateChange();
        };
        this.channels.reliable.channel = newChannel;
    }

    private createFastDataChannel() {
        let newChannel = this.peerConnection.createDataChannel(this.channels.fast.label, this.channels.fast.configuration);
        this.channels.fast.channel = newChannel;
    }

    private handleIncomingChannels(event: any) {
        let receiveChannel: any = event.channel;

        switch(receiveChannel.label) {
            case 'client-reliable-channel':
                receiveChannel.onmessage = (event: MessageEvent) => {
                    this.receiveReliableMessage(event);
                };
                break;
            case 'client-fast-channel':
                receiveChannel.onmessage = (event: MessageEvent) => {
                    this.receiveFastMessage(event);
                };
                break;
            default:
                console.error('Unkown data channel label received. ', receiveChannel.label);
                break;
        }
    }

    private receiveReliableMessage(event: MessageEvent) {
        let data = event.data;
        this.settings.events.reliableMessageReceived(data);
    }

    private receiveFastMessage(event: MessageEvent) {
        let data = event.data;
        this.settings.events.fastMessageReceived(data);
    }

    private handleReliableChannelStateChange() {
        let readyToSend = this.isReadyToSend();
        this.settings.events.readyToSend(readyToSend);
    }

    public isReadyToSend(): boolean {
        return (this.isPeerConnectionStarted && 
            this.channels.reliable.channel.readyState === 'open');
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

    public sendDataUsingReliableChannel(data: any) {
        if(typeof data !== 'string') {
            data = JSON.stringify(data);
        }
        if(this.isReadyToSend()) {
            this.channels.reliable.channel.send(data);
        } else {
            console.warn('Reliable channel not ready to send data! - data lost');
        }
    }

    public sendDataUsingFastChannel(data: any) {
        if(typeof data !== 'string') {
            data = JSON.stringify(data);
        }
        if(this.isPeerConnectionStarted && this.channels.fast.channel.readyState === 'open') {
            this.channels.fast.channel.send(data);
        }
    }

    private closeWebRTCConnection() {
        this.isPeerConnectionStarted = false;
        if(this.peerConnection !== null) {
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