interface JoystickButtonState {
	id: number
	pressed: boolean 
}

interface JoystickState {
	buttons: Array<JoystickButtonState>
	yaw: number;
	pitch: number;
	roll: number;
	throttle: number;
}

export class StateManager {
	public joystickState: JoystickState;

	constructor () {
		this.setInitialState();
	}

	private setInitialState(): void {
		this.joystickState = {
			yaw: 0,
			pitch: 0,
			roll: 0,
			throttle: 0,
			buttons: [
				{ 
					id: 0,
					pressed: false
				},
				{
					id: 1,
					pressed: false
				}
			]
		};
	}
}