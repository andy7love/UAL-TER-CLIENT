/// <reference path="../../typings/globals/node/index.d.ts" />
import { Utils } from '../helpers/Utils';

interface ClientConfiguration { 
    communication: {
        drone: {
            hostname: string,
            tcpPort: number,
            udpPort: number
        },
        relaySignalingServer: string,
        reconnectionTimeout: number
    }
}

class Configuration {
	private static instance: Configuration = null;
    private settings: ClientConfiguration;

	private constructor () {
        let defaults: ClientConfiguration = require('../../../config/relay-server/default.config.json');
        let env = require('../../../config/relay-server/env.config.json');
        this.settings = defaults;
        Utils.deepExtend(this.settings, env);
	}

    public static getSettings():ClientConfiguration {
        if(Configuration.instance === null)
            Configuration.instance = new Configuration();
        
        return Configuration.instance.settings;
    }
}

export default Configuration.getSettings();