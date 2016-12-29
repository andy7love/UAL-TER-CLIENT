import { WebRTCConnection } from "./helpers/WebRTCConnection";
const Kalm = require('kalm');

export class RelayServer {
	private webrtcConnection: WebRTCConnection = null;
	private isReliableChannelReady: boolean = false;
	private reconnectionTimeout: number = 1000; // ms.
	private droneHostname: string = '127.0.0.1';
	private tcpPort: number = 6000;
	private udpPort: number = 7000;
	private tcpClient: any = null;
	private udpClient: any = null;

	constructor () {
		console.log('Searching drone...');
		this.setupWebRTCConnection();

		setInterval(() => {
			this.retryConnection();
		}, this.reconnectionTimeout);
	}

	private retryConnection() {
		if(!this.isReliableChannelReady &&
			this.tcpClient == null) {
			// If connection lost or refused (maybe not found).
			// Try re-connection...
			this.connectWithTCPServer();
		} else if(this.isReliableChannelReady && this.tcpClient != null) {
			console.log('send ping!');
			this.tcpClient.send('pang', {a : 'hello' });
			this.tcpClient.send('messageEvent', {body: 'This is an object!'});

			if(this.udpClient != null) {
				this.udpClient.send('clientMessage', {a: 'holassss'});
			}
		}
	}

	private connectWithTCPServer() {
		this.tcpClient = new Kalm.Client({
			hostname: this.droneHostname, // Server's IP
			port: this.tcpPort, // Server's port
			adapter: 'tcp', // Server's adapter
			encoder: 'json', // Server's encoder
			channels: {
				droneMessage: (data) => {
					this.relayReliableMessageToClient(data);
				},
				pung: (data) => {
					console.log(data);
				}
			}
		}); 

		this.tcpClient.on('error', (error:any) => {
			if(	error.code != 'ECONNREFUSED' &&
			   	error.code != 'ECONNRESET' ) {
				console.log('TCP ERROR: ', error);
			}
		});

		this.tcpClient.on('connect', (socket) => {
			console.log('Connection with drone established');
			this.isReliableChannelReady = true;
			this.connectWithUDPServer();
			this.webrtcConnection.connect();
		});

		this.tcpClient.on('disconnect', (socket) => {
			this.tcpClient.destroy();
			this.tcpClient.removeAllListeners();
			this.tcpClient = null;

			if(this.isReliableChannelReady) {
				console.log('Disconnected from drone');
				this.isReliableChannelReady = false;
				this.udpClient.destroy();
				this.udpClient.removeAllListeners();
				this.udpClient = null;
				this.webrtcConnection.disconnect();
			}
		});
	}

	private connectWithUDPServer() {
		this.udpClient = new Kalm.Client({
			hostname: this.droneHostname, // Server's IP
			port: this.udpPort, // Server's port
			adapter: 'udp', // Server's adapter
			encoder: 'json', // Server's encoder
			channels: {
				droneMessage: (data) => {
					this.relayFastMessageToClient(data);
				},
				test: (data) => {
					console.log(data);
				}
			}
		});
	}

	private setupWebRTCConnection() {
		this.webrtcConnection = new WebRTCConnection({
			events: {
				connected: () => {
					console.log('webrtc connected!');
				},
				disconnected: () => {
					console.log('webrtc disconnected!');
					//this.state.communication.connected.setValue(false);
				},
				reliableMessageReceived: (data) => {
					this.relayReliableMessageToDrone(data);
				},
				fastMessageReceived: (data) => {
					this.relayFastMessageToDrone(data);
				},
				readyToSend: (ready:boolean) => {
					console.log('webrtc ready to send', ready);
					//this.state.communication.connected.setValue(ready);
				}
			}
		});
	}

	private relayReliableMessageToClient(data: any) {
		console.log(data);
		if(this.webrtcConnection) {
			this.webrtcConnection.sendDataUsingReliableChannel(data);
		}
	}

	private relayFastMessageToClient(data: any) {
		console.log(data);
		if(this.webrtcConnection) {
			this.webrtcConnection.sendDataUsingFastChannel(data);
		}
	}

	private relayReliableMessageToDrone(data: any) {
        if(typeof data === 'string') {
            data = JSON.parse(data);
        }
		if(this.isReliableChannelReady && this.tcpClient) {
			this.tcpClient.send('clientMessage', data);
		}
	}

	private relayFastMessageToDrone(data: any) {
        if(typeof data === 'string') {
            data = JSON.parse(data);
        }
		if(this.isReliableChannelReady && this.udpClient) {
			this.udpClient.send('clientMessage', data);
		}
	}
}

new RelayServer();