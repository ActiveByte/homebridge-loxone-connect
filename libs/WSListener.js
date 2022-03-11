const LxCommunicator = require('lxcommunicator');
const WebSocketConfig = LxCommunicator.WebSocketConfig;
const {
    v4: uuidv4
} = require('uuid');

const WSListener = function (platform) {
    this.socket = undefined;
    this.loxdata = undefined;

    this.log = platform.log;

    this.host = platform.host;
    this.port = platform.port;
    this.username = platform.username;
    this.password = platform.password;

    this.uuidCallbacks = [];

    // cache of the last value of any uuid received via the websocket
    this.uuidCache = [];

    this.startListener();
};

WSListener.prototype.startListener = async function () {
    const self = this;

    if (typeof this.socket == 'undefined') {
        this.uuid = uuidv4();

        const webSocketConfig = new WebSocketConfig(WebSocketConfig.protocol.WS,
            this.uuid, 'homebridge', WebSocketConfig.permission.APP, false);

        function handleAnyEvent(uuid, message) {
            self.log("WS: update event " + uuid + ":" + message);
            self.uuidCache[uuid] = message;
            if (typeof self.uuidCallbacks[uuid] != 'undefined') {
                for (let r = 0; r < self.uuidCallbacks[uuid].length; r++) {
                    self.uuidCallbacks[uuid][r](message);
                }
            }
        }

        webSocketConfig.delegate = {
            socketOnDataProgress: (socket, progress) => {
                this.log.debug('data progress ' + progress);
            },
            socketOnTokenConfirmed: (socket, response) => {
                this.log.debug('token confirmed');
            },
            socketOnTokenReceived: (socket, result) => {
                this.log.debug('token received');
            },
            socketOnConnectionClosed: (socket, code) => {
                this.log.info('Socket closed ' + code);

                if (code != LxCommunicator.SupportCode.WEBSOCKET_MANUAL_CLOSE) {
                    this.reconnect();
                }
            },
            socketOnEventReceived: (socket, events, type) => {
                this.log.debug(`socket event received ${type} ${JSON.stringify(events)}`);
                for (const evt of events) {
                    switch (type) {
                        case LxCommunicator.BinaryEvent.Type.EVENT:
                            handleAnyEvent(evt.uuid, evt.value);
                            break;
                        case LxCommunicator.BinaryEvent.Type.EVENTTEXT:
                            handleAnyEvent(evt.uuid, evt.text);
                            break;
                        case LxCommunicator.BinaryEvent.Type.EVENT:
                            handleAnyEvent(evt.uuid, evt);
                            break;
                        case LxCommunicator.BinaryEvent.Type.WEATHER:
                            handleAnyEvent(evt.uuid, evt);
                            break;
                        default:
                            break;
                    }
                }
            }
        };

        this.socket = new LxCommunicator.WebSocket(webSocketConfig);

        const success = await this.connect();

        if (!success) {
            this.reconnect();
        }
    }

};

WSListener.prototype.connect = async function () {
    this.log.info("Trying to connect to Miniserver");

    try {
        await this.socket.open(this.host + ':' + this.port, this.username, this.password);
    } catch (error) {
        this.log.error(`Couldn't open socket: ` + error);
        return false;
    }

    let file;
    try {
        file = await this.socket.send("data/LoxAPP3.json");
    } catch (error) {
        this.log.error(`Couldn't get structure file: ` + error);
        this.socket.close();
        return false;
    }
    this.loxdata = JSON.parse(file);

    try {
        await this.socket.send("jdev/sps/enablebinstatusupdate");
    } catch (error) {
        this.log.error(`Couldn't enable status updates: ` + error);
        this.socket.close();
        return false;
    }

    this.log.info("Connected");
    return true;
}

WSListener.prototype.reconnect = function () {
    const self = this;

    this.log.info("Reconnecting in 10 seconds...");

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function runTimer() {
        await delay(10000);
        const success = await self.connect();
        if (!success) {
            self.reconnect();
        }
    }
    runTimer();
}

WSListener.prototype.registerListenerForUUID = function (uuid, callback) {
    if (uuid in this.uuidCallbacks) {
        this.uuidCallbacks[uuid].push(callback);
    } else {
        this.uuidCallbacks[uuid] = [callback];
    }

    if (uuid in this.uuidCache) {
        for (let r = 0; r < this.uuidCallbacks[uuid].length; r++) {
            this.uuidCallbacks[uuid][r](this.uuidCache[uuid]);
        }
    }
};

WSListener.prototype.sendCommand = function (uuid, action) {
    this.socket.send(`jdev/sps/io/${uuid}/${action}`, 2);
};

WSListener.prototype.getLastCachedValue = function (uuid) {
    return this.uuidCache[uuid];
};

module.exports = WSListener;