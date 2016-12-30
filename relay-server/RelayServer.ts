import * as net from 'net';
import * as dgram from 'dgram';
import { WebRTCConnection } from "./helpers/WebRTCConnection";

export class RelayServer {
	private webrtcConnection: WebRTCConnection = null;
	private isReliableChannelReady: boolean = false;
	private reconnectionTimeout: number = 1000; // ms.
	private droneHostname: string = '127.0.0.1';
	private jsonSocket: any = null;

	private tcpPort: number = 6000;
	private tcpSocket: any = null;
	private tcpJsonSocket: any = null;

	private udpPort: number = 7000;
	
	//private udpSocket: dgram.Socket = null;

	constructor () {
		this.jsonSocket = require('json-socket');
		this.setupWebRTCConnection();

		console.log('Searching drone...');
		this.connectWithTCPServer();
		setInterval(() => {
			this.retryConnection();
		}, this.reconnectionTimeout);
	}

	private retryConnection() {
		if(!this.isReliableChannelReady) {
			// If connection lost or refused (maybe not found).
			// Try re-connection...
			this.tcpSocket.connect(this.tcpPort, this.droneHostname);
		} else {
			console.log('send ping!');
			this.tcpSocket.sendMessage({
				message: 'hello im client!'
			});
		}
	}

	private connectWithTCPServer() {
		this.tcpSocket = new this.jsonSocket(new net.Socket());

		this.tcpSocket.on('connect', (data) => {			
			console.log('Connection with drone established');
			this.isReliableChannelReady = true;
			this.connectWithUDPServer();
			this.webrtcConnection.connect();
		});

		this.tcpSocket.on('message', (data) => {			
			console.log('TCP recieved data from server: ', data);
		});

		this.tcpSocket.on("error", (error:any) => {
			if(	error.code != 'ECONNREFUSED' &&
				error.code != 'ECONNRESET' && 
				error.code != 'EINVAL' ) {
				console.log('TCP ERROR: ', error);
			}
		});

		this.tcpSocket.on('close', (had_error) => {
			this.handleDisconnectionFromDrone();
		});

		this.tcpSocket.on('end', () => {
			this.handleDisconnectionFromDrone();
		});

		/*
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
		*/
	}

	private handleDisconnectionFromDrone() {
		if(this.isReliableChannelReady) {
			console.log('disconnected from drone');
			this.isReliableChannelReady = false;
			this.webrtcConnection.disconnect();
			// drop udp connection ????
			
			console.log('Searching drone...');
		}
	}

	private connectWithUDPServer() {
		/*
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
		*/
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
		/*
        if(typeof data === 'string') {
            data = JSON.parse(data);
        }
		if(this.isReliableChannelReady && this.tcpClient) {
			this.tcpClient.send('clientMessage', data);
		}
		*/
	}

	private relayFastMessageToDrone(data: any) {
		/*
        if(typeof data === 'string') {
            data = JSON.parse(data);
        }
		if(this.isReliableChannelReady && this.udpClient) {
			this.udpClient.send('clientMessage', data);
		}
		*/
	}
}

new RelayServer();