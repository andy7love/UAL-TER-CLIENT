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

		var roll = document.getElementById('pitch');
		var pitch = document.getElementById('pitch-container');
		var height = pitch.getBoundingClientRect().height;
		
		this.state.simulation.orientation.getStream().changes().onValue((value) => {
			var euler = value.toEulerAngles();
			var p = euler.x*(-height/4);
			pitch.style.transform = 'translate3d(0,' + p + 'px,0)';

			var r = euler.z*90;
			roll.style.transform = 'rotate3d(0,0,1,' + r + 'deg)';
		});
	}
}