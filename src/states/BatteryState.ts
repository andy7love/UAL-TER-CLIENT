import { StateProperty } from '../helpers/StateProperty';

interface IBatteryStateValue {
	voltage: number;
	percentage: number;
	dischargeRate: number;
	autonomy: number;
}

export class BatteryState extends StateProperty<IBatteryStateValue> {
	constructor() {
		super({
			voltage: 0,
			percentage: 0,
			dischargeRate: 0,
			autonomy: 0
		});
	}
}
