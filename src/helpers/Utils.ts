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
        //console.log(euler);
        var result: RollPitchYaw = {
            pitch: -euler.x*90,
            roll: euler.z*90,
            yaw:  (euler.y+3)*60
        };
        return result;
    }
}