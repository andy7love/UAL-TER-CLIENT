import { ClientState } from "states/ClientState";

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

			this.state.joystick.setValue(this.normalizeAction(joystick));
		}
		
		requestAnimationFrame(this.inputLoop.bind(this));
	}

	private normalizeAction(joystick) {
		let roll = joystick.axes[0],
			pitch = joystick.axes[1],
			yaw = joystick.axes[5],
			throttle = -joystick.axes[6];

		// throttle interval resize
		throttle = (throttle + 1) / 2;

		// Deadzone
		if (Math.abs(roll) < .05) {
			roll = 0;
		}  
		if (Math.abs(pitch) < .05) {
			pitch = 0;
		}  
		if (Math.abs(yaw) < .05) {
			yaw = 0;
		}  
		if (throttle < .05) {
			throttle = 0;
		}
		
		// Sensitivity curve x^3
		roll = Math.pow(roll, 3);
		pitch = Math.pow(pitch, 3);
		yaw = Math.pow(yaw, 3);

		return {
			roll: this.roundAxis(roll),
			pitch: this.roundAxis(pitch),
			yaw: this.roundAxis(yaw),
			throttle: this.roundAxis(throttle)
		};
	}
}