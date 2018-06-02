import * as _ from 'underscore';

export class Utils {
	public static negate(value: boolean): boolean {
		return !value;
	}

	public static deepExtend(target: any, source: any): any {
		for (const prop in source) {
			if (prop in target && typeof target[prop] === 'object') {
				Utils.deepExtend(target[prop], source[prop]);
			} else {
				target[prop] = source[prop];
			}
		}
		return target;
	}
}
