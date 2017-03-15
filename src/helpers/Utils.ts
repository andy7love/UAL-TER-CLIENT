/// <reference path="../../typings/globals/underscore/index.d.ts" />

interface RollPitchYaw {
    roll: number;
    pitch: number;
    yaw: number;
}

export class Utils {
    public static negate(value: boolean): boolean {
        return !value;
    }

    public static toRollPitchYawDegrees(quaternion: BABYLON.Quaternion): RollPitchYaw {
        var euler = quaternion.toEulerAngles();
        var fitMidRangeAngle = (angle) => {
            if(angle >= 180) {
                return angle - 360;
            } else {
                return angle;
            }
        };
        var result: RollPitchYaw = {
            pitch: fitMidRangeAngle(BABYLON.Angle.FromRadians(-euler.x).degrees()),
            roll: fitMidRangeAngle(BABYLON.Angle.FromRadians(euler.z).degrees()),
            yaw: BABYLON.Angle.FromRadians(euler.y).degrees()
        };
        return result;
    }
}