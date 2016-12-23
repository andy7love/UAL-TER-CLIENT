import { WebRTCConnection } from "./helpers/WebRTCConnection";

export class RelayServer {
	private connection: WebRTCConnection;

	constructor () {
		this.initConnection();
	}

	private initConnection() {
		this.connection = new WebRTCConnection({
			events: {
				connected: () => {
					console.log('connected!');
				},
				disconnected: () => {
					console.log('disconnected!');
					//this.state.communication.connected.setValue(false);
				},
				messageReceived: (message) => {
					this.handleMessageReceived(message);
				},
				readyToSend: (ready:boolean) => {
					console.log('ready to send', ready);
					//this.state.communication.connected.setValue(ready);
				}
			}
		});
		this.connection.connect();
	}

	private handleMessageReceived(message: string) {
		try {
			let data: any = JSON.parse(message);
			if(data.joystick !== undefined) {
				//console.log(data.joystick);
			}
		} catch(e) {
			console.log('Error! Failed to parse message from client');
		}
	}
}

new RelayServer();