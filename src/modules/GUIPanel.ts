import { ClientState } from '../states/ClientState';
import * as dat from 'dat.gui';

export class GUIPanel {
	private gui: dat.GUI;
	private state: ClientState;

	constructor(state: ClientState) {
		this.gui = new dat.GUI();
		this.state = state;
		this.createJoystickUI();
	}

	private createJoystickUI(): void {
		const joystick = this.gui.addFolder('Joystick');
		const joystickStateValue = this.state.joystick.getValue();
		const controllers: Array<dat.GUIController> = [];

		controllers.push(joystick.add(joystickStateValue, 'roll', -1, 1).step(0.01));
		controllers.push(joystick.add(joystickStateValue, 'pitch', -1, 1).step(0.01));
		controllers.push(joystick.add(joystickStateValue, 'yaw', -1, 1).step(0.01));
		controllers.push(joystick.add(joystickStateValue, 'throttle', 0, 1).step(0.01));
		joystick.open();

		this.state.joystick
			.getStream()
			.changes()
			.skipDuplicates()
			.onValue(jsv => {
				joystickStateValue.pitch = jsv.pitch;
				joystickStateValue.yaw = jsv.yaw;
				joystickStateValue.roll = jsv.roll;
				joystickStateValue.throttle = jsv.throttle;

				controllers.forEach(controller => {
					controller.updateDisplay();
				});
			});
	}
}
