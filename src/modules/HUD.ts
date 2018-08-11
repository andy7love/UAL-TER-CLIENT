import { ClientState } from '../states/ClientState';
import { Utils } from 'ual-ter-protocol';
import * as $ from 'jquery';
const hudTemplate = require('../views/hud/hud.pug');

export class HUD {
	private renderInterval: number = 15;
	private state: ClientState;

	constructor(state: ClientState) {
		this.state = state;
		this.createHUD();
	}

	private createHUD(): void {
		const html = hudTemplate();
		const hud = document.createElement('div');
		hud.innerHTML = html;
		document.body.appendChild(hud);

		const pitch = $('#pitch');
		const pitchContainer = $('#pitch-container');
		const rollContainer = $('#roll-mask .roll-container');
		const headingContainer = $('#heading-mask .heading-container ul');
		const currentPitch = $('#current-pitch');
		const currentRoll = $('#current-roll');
		const currentHeading = $('#current-heading');

		const batteryProgressIndicator = $('.battery .indicator .progress');
		const batteryCurrentValue = $('.battery .indicator-current');

		this.state.drone.orientation
			.getStream()
			.skipDuplicates()
			.map(value => Utils.toRollPitchYawDegrees(value))
			.throttle(this.renderInterval)
			.onValue(value => {
				/*
				console.log('---------------------');
				console.log('  heading      : ', value.yaw);
				console.log('  roll         : ', value.roll);
				console.log('  pitch        : ', value.pitch);
				console.log('---------------------');
				*/

				// Pitch.
				const pitchGradeInPixels = 15;
				const p = (value.pitch * pitchGradeInPixels);
				pitchContainer.css('transform', 'translate3d(0,' + p + 'px,0)');
				currentPitch.text(Math.round(value.pitch));

				// Pitch-Roll.
				const r = value.roll;
				pitch.css('transform', 'rotate3d(0,0,1,' + r + 'deg)');

				// Roll.
				rollContainer.css('transform', 'rotate3d(0,0,1,' + r + 'deg)');
				currentRoll.text(Math.round(Math.abs(value.roll)));

				// Yaw-Heading.
				const yawGradeInPixels = -4;
				const y = (value.yaw * yawGradeInPixels);
				headingContainer.css('transform', 'translate3d(' + y + 'px,0,0)');
				currentHeading.text(Math.round(value.yaw));
			});

		this.state.drone.battery
			.getStream()
			.changes()
			.map(value => {
				value.voltage = parseFloat(value.voltage.toFixed(2));
				value.percentage = parseFloat(value.percentage.toFixed(3));
				value.dischargeRate = parseFloat(value.dischargeRate.toFixed(2));
				value.autonomy = Math.round(value.autonomy);
				return value;
			})
			.skipDuplicates()
			.throttle(this.renderInterval)
			.onValue(value => {
				// battery
				const percentage = Math.round(value.percentage * 100) + '%';
				batteryProgressIndicator.css('width', percentage);

				const dataToShow = [
					value.voltage.toFixed(2) + 'v',
					percentage,
					value.autonomy // TODO: to date.
				];
				batteryCurrentValue.text(dataToShow.join(' . '));
			});
	}
}
