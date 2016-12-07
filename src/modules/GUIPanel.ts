/// <reference path="../../typings/globals/dat-gui/index.d.ts" />
import { ClientState } from "states/ClientState";

export class GUIPanel {
	private gui: dat.GUI;
	private state: ClientState;

	constructor (state: ClientState) {
		this.gui = new dat.GUI();
		this.state = state;
		this.createJoystickUI();
	}

	private createJoystickUI() : void {
		let joystick = this.gui.addFolder('Joystick');
		let joystickStateValue = this.state.joystick.getValue();
		let controllers: Array<dat.GUIController> = [];

		controllers.push(joystick.add(joystickStateValue, 'roll', -1, 1).step(0.01));
		controllers.push(joystick.add(joystickStateValue, 'pitch', -1, 1).step(0.01));
        controllers.push(joystick.add(joystickStateValue, 'yaw', -1, 1).step(0.01));
		controllers.push(joystick.add(joystickStateValue, 'throttle', 0, 1).step(0.01));
		joystick.open();

		this.state.joystick
			.getStream()
			.changes()
			.skipDuplicates()
			.onValue((jsv) => {
				joystickStateValue.pitch = jsv.pitch;
				joystickStateValue.yaw = jsv.yaw;
				joystickStateValue.roll = jsv.roll;
				joystickStateValue.throttle = jsv.throttle;

				controllers.forEach((controller) => {
					controller.updateDisplay();
				});
			});
	}
}