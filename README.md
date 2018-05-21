# UAL-TER-CLIENT
Unmanned Aircraft Life - Terminal Client

Client for UAL-TER-C2 Drone.

Web based client using BabylonJS for some status rendering and communication using WebRTC to connect to a RelayServer that communicates with drone using UDP+TCP sockets. 

Please refer to the drone repo for further information "https://github.com/andy7love/UAL-TER-C2/".

## Run and Setup

- `npm install`
- `npm install -g bower`
- `bower install`
- `npm run dev` (for build and run)
- `npm start` (for re-run a previous build)

**Note:** Works on Node v.8.9.1

## WebRTC install troubleshooting.

- Open an elevated terminal
- Check for new versions of [wrtc](https://github.com/js-platform/node-webrtc).
- `npm install -g node-gyp`
- `npm install --global --production windows-build-tools`
- Optional: `node-gyp configure --msvs_version=2015`

### Further info
- https://github.com/nodejs/node-gyp/#installation
- https://www.npmjs.com/package/wrtc