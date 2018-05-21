import * as BABYLON from 'babylonjs';

interface IRollPitchYaw {
	roll: number;
	pitch: number;
	yaw: number;
}

export class Utils {
	public static negate(value: boolean): boolean {
		return !value;
	}

	public static toRollPitchYawDegrees(quaternion: BABYLON.Quaternion): IRollPitchYaw {
		const euler = quaternion.toEulerAngles();
		const fitMidRangeAngle = (angle: number) => {
			if (angle >= 180) {
				return angle - 360;
			} else {
				return angle;
			}
		};
		const result: IRollPitchYaw = {
			pitch: fitMidRangeAngle(BABYLON.Angle.FromRadians(-euler.x).degrees()),
			roll: fitMidRangeAngle(BABYLON.Angle.FromRadians(euler.z).degrees()),
			yaw: BABYLON.Angle.FromRadians(euler.y).degrees()
		};
		return result;
	}
}
