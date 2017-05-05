import { JoystickState } from "./JoystickState";
import { DroneState } from "./DroneState";
import { SimulationState } from "./SimulationState";
import { CommunicationState } from "./CommunicationState";
import { UIState } from "./UIState";

export class ClientState {
	public joystick: JoystickState;
	public drone: DroneState;
	public simulation: SimulationState;
	public communication: CommunicationState;
	public UIState: UIState;

	constructor() {
		this.joystick = new JoystickState();
		this.drone = new DroneState();
		this.simulation = new SimulationState();
		this.communication = new CommunicationState();
		this.UIState = new UIState();
	}
}