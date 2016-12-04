import { JoystickState } from "./JoystickState";
import { SimulationState } from "./SimulationState";
import { CommunicationState } from "./CommunicationState";

export class ClientState {
	public joystick: JoystickState;
	public simulation: SimulationState;
	public communication: CommunicationState;

	constructor() {
		this.joystick = new JoystickState();
		this.simulation = new SimulationState();
		this.communication = new CommunicationState();
	}
}