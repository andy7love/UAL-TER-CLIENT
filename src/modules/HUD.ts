/// <reference path="../../typings/globals/pug/index.d.ts" />
import { ClientState } from "states/ClientState";

export class HUD {
	private state: ClientState;

	constructor (state: ClientState) {
		this.state = state;
		this.createHUD();
	}

	private createHUD(): void {
		let html = templates['hud\\hud']({

		});
		let hud = document.createElement('div');
		hud.innerHTML = html;
		document.body.appendChild(hud);
	}
}