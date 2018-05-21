import { StateProperty } from "../helpers/StateProperty";

interface BatteryStateValue {
	voltage: number,
	percentage: number,
	dischargeRate: number,
	autonomy: number
}

export class BatteryState extends StateProperty<BatteryStateValue> {
	constructor () {
		super({
			voltage: 0,
			percentage: 0,
			dischargeRate: 0,
			autonomy: 0
		});
	}
}