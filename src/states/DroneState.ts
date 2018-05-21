import * as BABYLON from 'babylonjs';
import { StateProperty } from "../helpers/StateProperty";
import { BatteryState } from "./BatteryState";

export class DroneState {
	public battery: BatteryState;
	public orientation: StateProperty<BABYLON.Quaternion>;

	constructor () {
		this.battery = new BatteryState();
		this.orientation = new StateProperty<BABYLON.Quaternion>(new BABYLON.Quaternion(0,0,0,1)); 
	}
}