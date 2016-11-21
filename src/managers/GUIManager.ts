/// <reference path="../../typings/globals/dat-gui/index.d.ts" />
import { StateManager } from "managers/StateManager";

export class GUIManager {
	private gui: dat.GUI;
	private stateManager: StateManager;

	constructor (stateMgr: StateManager) {
		this.gui = new dat.GUI();
		this.stateManager = stateMgr;
		this.createJoystickUI();
	}

	private createJoystickUI() : void {
		let joystick = this.gui.addFolder('Joystick');
		joystick.add(this.stateManager.joystickState, 'roll', -1, 1).step(0.01).listen();
		joystick.add(this.stateManager.joystickState, 'pitch', -1, 1).step(0.01).listen();
        joystick.add(this.stateManager.joystickState, 'yaw', -1, 1).step(0.01).listen();
		joystick.add(this.stateManager.joystickState, 'throttle', -1, 1).step(0.01).listen();
		joystick.open();
	}
}