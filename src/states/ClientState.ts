import { JoystickState } from "./JoystickState";

export class ClientState {
	public joystickState: JoystickState;

	constructor() {
		this.joystickState = new JoystickState();
	}
}