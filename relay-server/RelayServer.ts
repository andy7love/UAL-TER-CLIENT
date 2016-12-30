import * as net from 'net';
import * as dgram from 'dgram';
import { WebRTCConnection } from "./helpers/WebRTCConnection";

export class RelayServer {
	private webrtcConnection: WebRTCConnection = null;
	private isReliableChannelReady: boolean = false;
	private reconnectionTimeout: number = 1000; // ms.
	private droneAddress: string = '127.0.0.1';
	private jsonSocket: any = null;

	private tcpPort: number = 6000;
	private tcpSocket: any = null;
	private tcpJsonSocket: any = null;

	private udpPort: number = 7000;
	private udpSocket: dgram.Socket = null;

	constructor () {
		this.jsonSocket = require('json-socket');
		this.setupWebRTCConnection();
		this.setupTCPConnection();
		this.setupUDPConnection();

		console.log('Searching drone...');
		setInterval(() => {
			this.retryConnection();
		}, this.reconnectionTimeout);
	}

	private retryConnection() {
		if(!this.isReliableChannelReady) {
			// If connection lost or refused (maybe not found).
			// Try re-connection...
			this.tcpSocket.connect(this.tcpPort, this.droneAddress);
		}
	}

	private setupTCPConnection() {
		this.tcpSocket = new this.jsonSocket(new net.Socket());

		this.tcpSocket.on('connect', (data) => {			
			console.log('Connection with drone established');
			this.isReliableChannelReady = true;
			this.webrtcConnection.connect();
		});

		this.tcpSocket.on('message', (data) => {
			this.relayReliableMessageToClient(data);
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
	}

	private handleDisconnectionFromDrone() {
		if(this.isReliableChannelReady) {
			console.log('disconnected from drone');
			this.isReliableChannelReady = false;
			this.webrtcConnection.disconnect();
			//this.udpSocket.close();
			
			console.log('Searching drone...');
		}
	}

	private setupUDPConnection() {
		this.udpSocket = dgram.createSocket('udp4');

		this.udpSocket.on("message", (msg, rinfo) => {
			this.relayFastMessageToClient(msg.toString());
		});

		this.udpSocket.on("err", (err) => {
			console.log("client error: \n" + err.stack);
		});

		this.udpSocket.on("close", () => {
			console.log("udp closed.");
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
				},
				reliableMessageReceived: (data) => {
					this.relayReliableMessageToDrone(data);
				},
				fastMessageReceived: (data) => {
					this.relayFastMessageToDrone(data);
				},
				readyToSend: (ready:boolean) => {
					console.log('webrtc ready to send', ready);
				}
			}
		});
	}

	private relayReliableMessageToClient(data: any) {
		if(this.webrtcConnection) {
			this.webrtcConnection.sendDataUsingReliableChannel(data);
		}
	}

	private relayFastMessageToClient(data: any) {
		if(this.webrtcConnection) {
			this.webrtcConnection.sendDataUsingFastChannel(data);
		}
	}

	private relayReliableMessageToDrone(data: any) {
        if(typeof data === 'string') {
            data = JSON.parse(data);
        }
		if(this.isReliableChannelReady) {
			this.tcpSocket.sendMessage(data);
		}
	}

	private relayFastMessageToDrone(data: any) {
		if(this.isReliableChannelReady) {
			var message = new Buffer(data);
			this.udpSocket.send(message, 0, message.length, this.udpPort, this.droneAddress);
		}
	}
}

new RelayServer();