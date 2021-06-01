const request = require("request");

const LockItem = function (widget, platform, homebridge) {
    Characteristic = homebridge.hap.Characteristic;

    this.platform = platform;
    this.uuidAction = widget.uuidAction; //to control a switch, use the uuidAction
    this.stateUuid = widget.states.active; //a switch always has a state called active, which is the uuid which will receive the event to read
    this.currentState = undefined; //will be 0 or 1 for Switch
    this.autoTimer = undefined;

    this.autoLock = platform.autoLock;
    this.autoLockDelay = platform.autoLockDelay;

    LockItem.super_.call(this, widget, platform, homebridge);
};

// Register a listener to be notified of changes in this items value
LockItem.prototype.initListener = function () {
    this.platform.ws.registerListenerForUUID(this.stateUuid, this.callBack.bind(this));
};

LockItem.prototype.callBack = function (value) {
    //console.log("Got new state for lock: " + value);

    this.currentState = !value;

    this.otherService.getCharacteristic(Characteristic.LockCurrentState).updateValue(this.currentState == '1');

    if (this.autoLock) {
        if (this.currentState == 0) {
            this.autoLockFunction()
        } else {
            clearTimeout(this.autoTimer);
            this.log(`[Lock] Cancelled autolock`);
        }
    }
};

LockItem.prototype.getOtherServices = function () {
    const otherService = new this.homebridge.hap.Service.LockMechanism();

    otherService.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED);
    otherService.setCharacteristic(Characteristic.LockTargetState, Characteristic.LockTargetState.SECURED);

    otherService.getCharacteristic(Characteristic.LockTargetState)
        .on('set', this.setItemState.bind(this))

    return otherService;
};

LockItem.prototype.autoLockFunction = function () {
    this.log(`[Lock] Waiting ${this.autoLockDelay} seconds for autolock`);

    this.autoTimer = setTimeout(() => {
        this.otherService.setCharacteristic(Characteristic.LockTargetState, Characteristic.LockTargetState.SECURED)
    }, this.autoLockDelay * 1000)
};

LockItem.prototype.setItemState = function (value, callback) {
    const command = (value != '1') ? 'On' : 'Off';
    this.log(`[Lock] - send message to ${this.name}: ${command}`);
    this.platform.ws.sendCommand(this.uuidAction, command);
    callback();
};

module.exports = LockItem;