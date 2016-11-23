import { StateManager } from "managers/StateManager";

export class NetworkManager {
	private stateManager: StateManager;

	constructor (stateMgr: StateManager) {
		this.stateManager = stateMgr;
	}
}