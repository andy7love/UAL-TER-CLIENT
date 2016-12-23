import { WebRTCConnection } from "./helpers/WebRTCConnection";
const Kalm = require('kalm');

export class RelayServer {
	private webrtcConnection: WebRTCConnection;
	private isReliableChannelReady: boolean = false;
	private isFastChannelReady: boolean = false;
	private reconnectionTimeout: number = 1000; // ms.
	private droneHostname: string = 'localhost';
	private tcpPort: number = 6000;
	private udpPort: number = 7000;
	private tcpClient: any;
	private udpClient: any;

	constructor () {
		console.log('Searching drone...');
		this.initWebRTCConnection();
		this.connectWithTCPServer();
	}

	private initWebRTCConnection() {
		this.webrtcConnection = new WebRTCConnection({
			events: {
				connected: () => {
					console.log('webrtc connected!');
				},
				disconnected: () => {
					console.log('webrtc disconnected!');
					//this.state.communication.connected.setValue(false);
				},
				messageReceived: (message) => {
					this.handleMessageReceived(message);
				},
				readyToSend: (ready:boolean) => {
					console.log('webrtc ready to send', ready);
					//this.state.communication.connected.setValue(ready);
				}
			}
		});
	}

	private connectWithTCPServer() {
		this.tcpClient = new Kalm.Client({
			hostname: this.droneHostname, // Server's IP
			port: this.tcpPort, // Server's port
			adapter: 'tcp', // Server's adapter
			encoder: 'json', // Server's encoder
			channels: {
				userEvent: (data) => {
					console.log('Server: ' + data);
				}
			}
		});
	
		this.tcpClient.send('messageEvent', {body: 'This is an object!'}); 
		this.tcpClient.subscribe('someOtherEvent', function() {

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
			this.webrtcConnection.connect();
			this.connectWithUDPServer();
		});

		this.tcpClient.on('disconnect', (socket) => {
			if(this.isReliableChannelReady) {
				console.log('Disconnected from drone');
				this.isReliableChannelReady = false;
				this.tcpClient.destroy();
				this.udpClient.destroy();
				this.webrtcConnection.disconnect();
				// DO something else!
				// also reject UDP.
				// and WebRTC? 
			}

			// Connection lost or refused (maybe not found).
			// Try re-connection...
			setTimeout(() => {
				this.connectWithTCPServer();
			}, this.reconnectionTimeout);
		});
	}

	private connectWithUDPServer() {
		this.udpClient = new Kalm.Client({
			hostname: this.droneHostname, // Server's IP
			port: this.udpPort, // Server's port
			adapter: 'udp', // Server's adapter
			encoder: 'json', // Server's encoder
			channels: {
				userEvent: (data) => {
					console.log('Server: ' + data);
				}
			}
		});
	
		this.tcpClient.send('messageEvent', {body: 'This is an object!'}); 
		this.tcpClient.subscribe('someOtherEvent', function() {

		});
	}

	private handleMessageReceived(message: string) {
		/*
		TODO!.
		try {
			let data: any = JSON.parse(message);
			if(data.joystick !== undefined) {
				//console.log(data.joystick);
			}
		} catch(e) {
			console.log('Error! Failed to parse message from client');
		}
		*/
	}
}

new RelayServer();