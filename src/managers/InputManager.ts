import { StateManager } from "managers/StateManager";

export class InputManager {
	private stateManager: StateManager;

	constructor (stateMgr: StateManager) {
		this.stateManager = stateMgr;
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
		if (!gamepads) {
			return;
		}
		let joystick: Gamepad = gamepads[0];

		this.stateManager.joystickState.roll = this.roundAxis(joystick.axes[0])
		this.stateManager.joystickState.pitch = this.roundAxis(joystick.axes[1]);
		this.stateManager.joystickState.yaw = this.roundAxis(joystick.axes[5]);
		this.stateManager.joystickState.throttle = this.roundAxis((joystick.axes[6])*-1);

		requestAnimationFrame(this.inputLoop.bind(this));
	}
}