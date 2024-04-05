const DimmerItem = function (widget, platform, homebridge) {

    this.platform = platform;
    this.uuidAction = widget.uuidAction; //to control a dimmer, use the uuidAction
    this.stateUuid = widget.states.position; //a dimmer always has a state called position, which is the uuid which will receive the event to read
    this.currentState = 0; //will be a value between 0 and 100 for dimmers
    this.lastUpdate = 0; //last update
    this.lastBrightnessUpdate = 0; //last brightness update
    this.lastBrightnessValue = 0; //last brightness value
    DimmerItem.super_.call(this, widget, platform, homebridge);
};

// Register a listener to be notified of changes in this items value
DimmerItem.prototype.initListener = function () {
    this.platform.ws.registerListenerForUUID(this.stateUuid, this.callBack.bind(this));
};

DimmerItem.prototype.callBack = function (value) { // Loxone > Homebridge

    //console.log("Got new state for dimmer " + value);

    if ((Date.now() - this.lastUpdate) > 500) { // Ignore callback when received change from homekit
        this.currentState = value;

        //also make sure this change is directly communicated to HomeKit
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.On)
            .updateValue(this.currentState > 0);
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.Brightness)
            .updateValue(this.currentState);
    }
};

DimmerItem.prototype.getOtherServices = function () {

    const otherService = new this.homebridge.hap.Service.Lightbulb();

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.On)
        .on('set', this.setItemPowerState.bind(this))
        .on('get', this.getItemPowerState.bind(this))
        .updateValue(this.currentState > 0);

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.Brightness)
        .on('set', this.setItemState.bind(this))
        .on('get', this.getItemState.bind(this))
        .updateValue(this.currentState);

    return otherService;
};

DimmerItem.prototype.getItemState = function (callback) {
    //returns brightness value
    callback(undefined, this.currentState);
};

DimmerItem.prototype.getItemPowerState = function (callback) {
    //returns true if currentState is > 0
    callback(undefined, this.currentState > 0);
};

DimmerItem.prototype.setItemState = function (value, callback) {
    this.lastBrightnessUpdate = new Date().getTime();
    this.lastBrightnessValue = value;

    this.log(`[Dimmer] HomeKit - send brightness message to ${this.name}: ${value}`);
    this.platform.ws.sendCommand(this.uuidAction, value);

    callback();
};

DimmerItem.prototype.setItemPowerState = async function (value, callback) {
    this.lastUpdate = Date.now();

    await new Promise(resolve => setTimeout(resolve, 100));

    if ((Date.now() - this.lastBrightnessUpdate) > 105) {
        const command = (value == '1') ? 'On' : 'Off';

        // If the dimmer was turned off, resend the last brightness value instead of a simple 'On' command
        if (command == 'On') {
            if (this.lastBrightnessValue == 0) {
                this.lastBrightnessValue = 100;
            }
            this.log(`[Dimmer] HomeKit - send brightness message to ${this.name}: ${this.lastBrightnessValue}`);
            this.platform.ws.sendCommand(this.uuidAction, this.lastBrightnessValue);
        }
        else {
            this.log(`[Dimmer] HomeKit - send on/off message to ${this.name}: ${command}`);
            this.platform.ws.sendCommand(this.uuidAction, command);
        }
    }

    callback();
};

module.exports = DimmerItem;
