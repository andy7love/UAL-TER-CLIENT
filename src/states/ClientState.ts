import { JoystickState } from "./JoystickState";
import { SimulationState } from "./SimulationState";
import { CommunicationState } from "./CommunicationState";
import { UIState } from "./UIState";

export class ClientState {
	public joystick: JoystickState;
	public simulation: SimulationState;
	public communication: CommunicationState;
	public UIState: UIState;

	constructor() {
		this.joystick = new JoystickState();
		this.simulation = new SimulationState();
		this.communication = new CommunicationState();
		this.UIState = new UIState();
	}
}