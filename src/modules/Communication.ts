import { WebRTCConnection } from "helpers/WebRTCConnection";
import { ClientState } from "../states/ClientState";

export class Communication {
	private state: ClientState;
	private connection: WebRTCConnection;

	constructor (state: ClientState) {
		this.state = state;

		this.connection = new WebRTCConnection({
			events: {
				connected: () => {
					console.log('connected!');
				},
				disconnected: () => {
					console.log('disconnected!');
				},
				messageReceived: (message) => {
					console.log('message received: ', message);
				},
				readyToSend: (ready:boolean) => {
					console.log('ready to send', ready);
					if(ready === true) {
						this.connection.sendDataUsingReliableChannel('hey im client!');
					}
				}
			}
		});
		this.connection.connect();
	}
}