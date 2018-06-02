import { StateProperty } from '../helpers/StateProperty';

interface IJoystickStateValue {
	yaw: number;
	pitch: number;
	roll: number;
	throttle: number;
}

export class JoystickState extends StateProperty<IJoystickStateValue> {
	constructor() {
		super({
			yaw: 0,
			pitch: 0,
			roll: 0,
			throttle: 0
		});
	}
}
