import { WebRTCConnection } from '../helpers/WebRTCConnection';
import { ClientState } from '../states/ClientState';
import * as Bacon from 'baconjs';
import {
	DroneRealTimeTelemetryParser,
	ClientRealTimeControlParser,
	IClientRealTimeControl,
	Utils
} from 'ual-ter-protocol';
export class Communication {
	private state: ClientState;
	private connection: WebRTCConnection;

	constructor(state: ClientState) {
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
				messageReceived: message => {
					this.handleMessageReceived(message);
				},
				readyToSend: (ready: boolean) => {
					console.log('ready to send', ready);
					this.state.communication.connected.setValue(ready);
				}
			}
		});
		this.connection.connect();
	}

	private configureStreaming() {
		const combinedProperty = Bacon.combineTemplate({
			joystick: this.state.joystick.getStream()
		});

		combinedProperty
			.toEventStream()
			.skipWhile(this.state.communication.connected.getStream().map(Utils.negate))
			.onValue((state: IClientRealTimeControl) => {
				const data =  ClientRealTimeControlParser.serialize({
					ping: new Date().getTime(),
					joystick: state.joystick
				});

				this.connection.sendDataUsingFastChannel(data);
			});
	}

	private handleMessageReceived(message: string) {
		try {
			const data = DroneRealTimeTelemetryParser.parse(JSON.parse(message));

			this.state.drone.battery.setValue(data.battery);
			this.state.drone.orientation.setValue(data.orientation);

			if (data.simulation !== undefined) {
				this.state.simulation.position.setValue(data.simulation.position);
				this.state.simulation.orientation.setValue(data.simulation.orientation);
			}
		} catch (e) {
			console.error('Error! Failed to parse message from client: ', e);
		}
	}
}
