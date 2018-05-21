import { StateProperty } from "../helpers/StateProperty";

export class UIState {
    public firstPersonCamera: StateProperty<boolean>;

	constructor () {
		this.firstPersonCamera = new StateProperty<boolean>(true); 
	}
}