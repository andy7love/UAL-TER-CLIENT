import { Utils } from '../helpers/Utils';

interface IClientConfiguration {
	communication: {
		drone: {
			hostname: string,
			tcpPort: number,
			udpPort: number
		},
		relaySignalingServer: string,
		reconnectionTimeout: number
	};
}

class Configuration {
	public static getSettings(): IClientConfiguration {
		if (Configuration.instance === null) {
			Configuration.instance = new Configuration();
		}

		return Configuration.instance.settings;
	}

	private static instance: Configuration = null;
	private settings: IClientConfiguration;

	private constructor() {
		const defaults: IClientConfiguration = require('../../../config/relay-server/default.config.json');
		const env = require('../../../config/relay-server/env.config.json');
		this.settings = defaults;
		Utils.deepExtend(this.settings, env);
	}
}

export default Configuration.getSettings();
