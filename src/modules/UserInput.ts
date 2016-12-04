import { ClientState } from "../states/ClientState";

export class UserInput {
	private state: ClientState;

	constructor (state: ClientState) {
		this.state = state;
		this.inputLoop();
	}

	private round(value: number, decimals: number): number {
		return +(value.toFixed(decimals));
	}

	private roundAxis(value: number): number {
		return this.round(value, 2);
	}

	private inputLoop() {
		let gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
		if (gamepads && gamepads[0]) {
			let joystick: Gamepad = gamepads[0];

			this.state.joystickState.setValue({
				roll: this.roundAxis(joystick.axes[0]),
				pitch:  this.roundAxis(joystick.axes[1]),
				yaw: this.roundAxis(joystick.axes[5]),
				throttle: this.roundAxis((joystick.axes[6])*-1)
			});
		}
		
		requestAnimationFrame(this.inputLoop.bind(this));
	}
}