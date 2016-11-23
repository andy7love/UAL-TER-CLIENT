/// <reference path="../../typings/globals/socket.io-client/index.d.ts" />
/// <reference path="../../typings/globals/webrtc/rtcpeerconnection/index.d.ts" />

interface WebRTCConnectionSettings {
    events: {
        connected?: () => void,
        disconnected?: () => void,
        readyToSend?: (ready: boolean) => void,
        messageReceived?: (data: string) => void
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
    private channels: ClientChannels = {
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
    private signalingServerURL: string = '//localhost:8080';
    private socket:SocketIOClient.Socket;
    private peerConnection: RTCPeerConnection;
    private isPeerConnectionStarted: boolean = false;
    private settings: WebRTCConnectionSettings;

    constructor(settings: WebRTCConnectionSettings) {
        this.settings = settings;
    }

    public connect(): void {
        this.socket = io.connect(this.signalingServerURL);
        this.socket.on(WebRTCConnection.SignalingEvents.clientConnected, () => {
            console.log('Warning! another client was connected! I will not receive more signaling messages. Disconnecting...');
            this.closeConnection();
        });
        this.socket.on(WebRTCConnection.SignalingEvents.droneConnected, () => {
            if(this.isPeerConnectionStarted) {
                // new drone! replace connection.
                this.closeConnection();
            }
            this.startPeerConnection();
        });
        this.socket.on(WebRTCConnection.SignalingEvents.messageToClient, (message) => {
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

    private sendMessageToDrone(message: any): void {
        this.socket.emit(WebRTCConnection.SignalingEvents.messageToDrone, message);
    }

    private handleMessageToClient(message): void {
        if(!this.isPeerConnectionStarted) {
            return;
        }

        if (message.type === WebRTCConnection.SignalingPeerMessages.answer) {
            this.peerConnection.setRemoteDescription(new RTCSessionDescription(message));
        } else if (message.type === WebRTCConnection.SignalingPeerMessages.candidate) {
            var candidate = new RTCIceCandidate({
                sdpMLineIndex: message.label,
                candidate: message.candidate
            });
            this.peerConnection.addIceCandidate(candidate);
        } else if (message === WebRTCConnection.SignalingPeerMessages.disconnect) {
            this.disconnect();
        }
    }

    private startPeerConnection(): void {
        if (!this.isPeerConnectionStarted) {
            this.createPeerConnection();
            this.isPeerConnectionStarted = true;
            this.peerConnection.createOffer((sessionDescription) => {
                this.peerConnection.setLocalDescription(sessionDescription);
                this.sendMessageToDrone(sessionDescription);
                this.settings.events.connected();
            }, (error) => {
                console.log('createOffer() error: ', error);
            });
        }
    }

    private createPeerConnection(): void {
        try {
            this.peerConnection = new RTCPeerConnection(null);
            this.peerConnection.onicecandidate = (event) => {
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

    private handleIncomingChannels(event: RTCDataChannelEvent) {
        let receiveChannel: RTCDataChannel = event.channel;
        receiveChannel.onmessage = (event) => {
            this.receiveMessage(event);
        };
    }

    private receiveMessage(event: RTCMessageEvent) {
        let data = event.data;
        this.settings.events.messageReceived(data);
    }

    private handleReliableChannelStateChange() {
        let readyToSend = this.isReadyToSend();
        this.settings.events.readyToSend(readyToSend);
    }

    public isReadyToSend(): boolean {
        return (this.isPeerConnectionStarted && 
            this.channels.reliable.channel.readyState === 'open');
    }

    private handleIceCandidate(event) {
        if (event.candidate) {
            this.sendMessageToDrone({
                type: 'candidate',
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate
            });
        }
    }

    public sendDataUsingReliableChannel(data: string) {
        if(this.isReadyToSend()) {
            this.channels.reliable.channel.send(data);
        } else {
            console.log('Warning! Reliable channel not ready to send data! - data lost');
        }
    }

    public sendDataUsingFastChannel(data: string) {
        if(this.isPeerConnectionStarted && this.channels.fast.channel.readyState === 'open') {
            this.channels.fast.channel.send(data);
        }
    }

    private closeConnection() {
        this.isPeerConnectionStarted = false;
        this.peerConnection.close();
        this.peerConnection = null;
        this.settings.events.disconnected();
    }
}