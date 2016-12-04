import { Utils } from "helpers/Utils";
import { WebRTCConnection } from "helpers/WebRTCConnection";
import { ClientState } from "states/ClientState";

export class Communication {
	private state: ClientState;
	private connection: WebRTCConnection;

	constructor (state: ClientState) {
		this.state = state;
		this.initConnection();
		this.configureStreaming();
	}

	private initConnection() {
		this.connection = new WebRTCConnection({
			events: {
				connected: () => {
					console.log('connected!');
				},
				disconnected: () => {
					console.log('disconnected!');
					this.state.communication.connected.setValue(false);
				},
				messageReceived: (message) => {
					this.handleMessageReceived(message);
				},
				readyToSend: (ready:boolean) => {
					console.log('ready to send', ready);
					this.state.communication.connected.setValue(ready);
				}
			}
		});
		this.connection.connect();
	}

	private configureStreaming() {
		this.state.communication.connected.getStream().map((v) => {
			return !v;
		}).onValue((ready) => {
			console.log(ready);
		});

		this.state.joystick.getStream()
			.toEventStream()
			.skipWhile(this.state.communication.connected.getStream().map(Utils.negate))
			.onValue((joystick) => {
				this.connection.sendDataUsingFastChannel({
					joystick: joystick
				});
			});
	}

	private handleMessageReceived(message: string) {
		try {
			let data: any = JSON.parse(message);
			if(data.simulation !== undefined) {
				this.state.simulation.position.setValue(data.simulation.position);
				this.state.simulation.orientation.setValue(data.simulation.orientation);
			}
		} catch(e) {
			console.log('Error! Failed to parse message from client');
		}
	}
}