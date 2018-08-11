import { StateProperty } from '../helpers/StateProperty';
import { IJoystickState } from 'ual-ter-protocol';

export class JoystickState extends StateProperty<IJoystickState> {
	constructor() {
		super({
			yaw: 0,
			pitch: 0,
			roll: 0,
			throttle: 0
		});
	}
}
