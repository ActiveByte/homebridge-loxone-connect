const SwitchItem = function (widget, platform, homebridge) {

    this.platform = platform;
    this.uuidAction = widget.uuidAction;
    this.stateUuid = widget.states.active;
    this.currentState = undefined;

    SwitchItem.super_.call(this, widget, platform, homebridge);
};

// Register a listener to be notified of changes in this items value
SwitchItem.prototype.initListener = function () {
    this.platform.ws.registerListenerForUUID(this.stateUuid, this.callBack.bind(this));
};

SwitchItem.prototype.callBack = function (value) {
    //function that gets called by the registered ws listener
    //console.log("Got new state for switch: " + value);

    this.currentState = value;

    //also make sure this change is directly communicated to HomeKit
    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.On)
        .updateValue(this.currentState == '1');
};

SwitchItem.prototype.getOtherServices = function () {
    const otherService = new this.homebridge.hap.Service.Switch();

    this.item = 'Switch';

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.On)
        .on('set', this.setItemState.bind(this))
        .on('get', this.getItemState.bind(this))
        .updateValue(this.currentState == '1');

    return otherService;
};

SwitchItem.prototype.getItemState = function (callback) {
    //returns true if currentState is 1
    callback(undefined, this.currentState == '1');
};

SwitchItem.prototype.setItemState = function (value, callback) {
    //sending new state to loxone
    //added some logic to prevent a loop when the change because of external event captured by callback
    const newState = Boolean(value);
    if (newState !== Boolean(this.currentState)) {
        const command = newState ? 'On' : 'Off';
        this.log(`[${this.item}] - send message to ${this.name}: ${command}, previous state: ${this.currentState}`);
        this.platform.ws.sendCommand(this.uuidAction, command);
    } else {
        this.log(`[${this.item}] - ignoring state change to ${this.name}: ${newState}, previous state: ${this.currentState}`);
    }
    callback();
};

module.exports = SwitchItem;