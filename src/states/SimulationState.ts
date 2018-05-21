import { StateProperty } from "../helpers/StateProperty";
import * as BABYLON from 'babylonjs';

export class SimulationState {
    public position: StateProperty<BABYLON.Vector3>;
	public orientation: StateProperty<BABYLON.Quaternion>;

	constructor () {
		this.position = new StateProperty<BABYLON.Vector3>(new BABYLON.Vector3(0,0,0));
		this.orientation = new StateProperty<BABYLON.Quaternion>(new BABYLON.Quaternion(0,0,0,1)); 
	}
}