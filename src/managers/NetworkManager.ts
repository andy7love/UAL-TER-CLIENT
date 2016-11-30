import { WebRTCConnection } from "helpers/WebRTCConnection";
import { StateManager } from "managers/StateManager";

export class NetworkManager {
	private stateManager: StateManager;
	private connection: WebRTCConnection;

	constructor (stateMgr: StateManager) {
		this.stateManager = stateMgr;

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