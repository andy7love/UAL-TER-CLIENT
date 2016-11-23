import { WebRTCConnection } from "helpers/WebRTCConnection";
import { StateManager } from "managers/StateManager";

export class NetworkManager {
	private stateManager: StateManager;
	private connection: WebRTCConnection;

	constructor (stateMgr: StateManager) {
		this.stateManager = stateMgr;

		this.connection = new WebRTCConnection({
			events: {
				
			}
		});
		this.connection.connect();
	}
}