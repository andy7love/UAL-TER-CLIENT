/// <reference path="../../bower_components/babylonjs/dist/babylon.2.4.d.ts" />
import { StateProperty } from "helpers/StateProperty";

export class SimulationState {
    public position: StateProperty<BABYLON.Vector3>;
	public orientation: StateProperty<BABYLON.Vector3>;

	constructor () {
		this.position = new StateProperty<BABYLON.Vector3>(new BABYLON.Vector3(0,0,0));
		this.orientation = new StateProperty<BABYLON.Vector3>(new BABYLON.Vector3(0,0,0)); 
	}
}