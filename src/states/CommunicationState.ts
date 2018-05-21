import { StateProperty } from '../helpers/StateProperty';

export class CommunicationState {
	public connected: StateProperty<boolean>;

	constructor() {
		this.connected = new StateProperty<boolean>(false);
	}
}
