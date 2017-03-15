/// <reference path="../../typings/globals/pug/index.d.ts" />
import { ClientState } from "states/ClientState";
import { Utils } from "helpers/Utils";

export class HUD {
	private renderInterval: number = 15;
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

		var pitch = $('#pitch');
		var pitchContainer = $('#pitch-container');
		var rollContainer = $('#roll-mask .roll-container');
		var headingContainer = $('#heading-mask .heading-container ul');
		var currentPitch = $('#current-pitch');
		var currentRoll = $('#current-roll');
		var currentHeading = $('#current-heading');

		var batteryProgressIndicator = $('.battery .indicator .progress');
		var batteryCurrentValue = $('.battery .indicator-current');
		
		this.state.simulation.orientation
			.getStream()
			.skipDuplicates()
			.map(value => Utils.toRollPitchYawDegrees(value))
			.throttle(this.renderInterval)
			.onValue((value) => {
				// Pitch.
				var pitchGradeInPixels = 15;
				var p = (value.pitch * pitchGradeInPixels);
				pitchContainer.css('transform', 'translate3d(0,' + p + 'px,0)');
				currentPitch.text(Math.round(value.pitch));

				// Pitch-Roll.
				var r = value.roll;
				pitch.css('transform', 'rotate3d(0,0,1,' + r + 'deg)');

				// Roll.
				rollContainer.css('transform', 'rotate3d(0,0,1,' + r + 'deg)');
				currentRoll.text(Math.round(Math.abs(value.roll)));

				// Yaw-Heading.
				var yawGradeInPixels = -4;
				var y = (value.yaw * yawGradeInPixels);
				headingContainer.css('transform', 'translate3d(' + y + 'px,0,0)');
				currentHeading.text(Math.round(value.yaw));
		});

		this.state.battery
			.getStream()
			.changes()
			.map((value) => {
				value.voltage = parseFloat(value.voltage.toFixed(2));
				value.percentage = parseFloat(value.percentage.toFixed(3));
				value.dischargeRate =  parseFloat(value.dischargeRate.toFixed(2));
				value.autonomy = Math.round(value.autonomy);
				return value;
			})
			.skipDuplicates()
			.throttle(this.renderInterval)
			.onValue((value) => {
				// battery
				var percentage = Math.round(value.percentage*100) + '%';
				batteryProgressIndicator.css('width', percentage);

				var dataToShow = [
					value.voltage.toFixed(2) + 'v',
					percentage,
					value.autonomy // TODO: to date.
				];
				batteryCurrentValue.text(dataToShow.join(' . '));
			});
	}
}