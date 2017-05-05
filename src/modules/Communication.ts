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
				data.simulation.position = new BABYLON.Vector3(data.simulation.position.x, data.simulation.position.y, data.simulation.position.z);
				data.simulation.orientation = new BABYLON.Quaternion(data.simulation.orientation.x, data.simulation.orientation.y, data.simulation.orientation.z, data.simulation.orientation.w);

				this.state.simulation.position.setValue(data.simulation.position);
				this.state.simulation.orientation.setValue(data.simulation.orientation);
			}

			if(data.drone !== undefined) {
				this.state.drone.battery.setValue(data.drone.battery);

				data.drone.orientation = new BABYLON.Quaternion(data.drone.orientation.x, data.drone.orientation.y, data.drone.orientation.z, data.drone.orientation.w);
				this.state.drone.orientation.setValue(data.drone.orientation);
			}
			
		} catch(e) {
			console.error('Error! Failed to parse message from client: ', e);
		}
	}
}