import { BatteryState } from "./BatteryState";
import { JoystickState } from "./JoystickState";
import { SimulationState } from "./SimulationState";
import { CommunicationState } from "./CommunicationState";
import { UIState } from "./UIState";

export class ClientState {
	public battery: BatteryState;
	public joystick: JoystickState;
	public simulation: SimulationState;
	public communication: CommunicationState;
	public UIState: UIState;

	constructor() {
		this.battery = new BatteryState();
		this.joystick = new JoystickState();
		this.simulation = new SimulationState();
		this.communication = new CommunicationState();
		this.UIState = new UIState();
	}
}