"use strict";

var request = require("request");

const DEFAULT_SWITCH_ID = 0

var RadioSwitchItem = function (widget, platform, homebridge) {
    this.platform = platform;
    this.uuidAction = widget.uuidAction;    // this is a dummy uuidAction
    this.stateUuidActiveOutput = widget.states.activeOutput;
    this.radio = widget.radio;
    this.uuidActionOriginal = widget.uuidActionOriginal;

    this.currentState = undefined;

    RadioSwitchItem.super_.call(this, widget, platform, homebridge);
};

// Register a listener to be notified of changes in this items value
RadioSwitchItem.prototype.initListener = function () {
    this.platform.ws.registerListenerForUUID(this.stateUuidActiveOutput, this.callBackActiveOutput.bind(this));
};

RadioSwitchItem.prototype.callBackActiveOutput = function (value) {
    this.currentState = value == this.radio.id;
    // console.log('Radio callBackActiveOutput ' + this.name + ': IsOn? ' + this.currentState);

    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.On)
        .updateValue(this.currentState);
};

RadioSwitchItem.prototype.getOtherServices = function () {
    var otherService = new this.homebridge.hap.Service.Switch();

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.On)
        .on('set', this.setItemState.bind(this))
        .on('get', this.getItemState.bind(this))

    return otherService;
};

RadioSwitchItem.prototype.getItemState = function (callback) {
    // console.log('Radio getItemState ' + this.name + ': IsOn? ' + this.currentState);
    callback(undefined, this.currentState);
};

RadioSwitchItem.prototype.setItemState = function (value, callback) {
    if (value == true) {
        // update local state
        this.currentState = true;
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.On)
            .updateValue(this.currentState);

        // send the radio output change command to Loxone
        var command = this.radio.id === DEFAULT_SWITCH_ID ? "reset" : `${this.radio.id}`;
        // this.log("[RadioSwitchItem] Send message to '" + this.name + "', id: " + this.radio.id + ", Command: '" + command + "'");
        this.platform.ws.sendCommand(this.uuidActionOriginal, command);
    } else {
        // default switch option cannot be switched off since all other switched default to it
        const canSwitchOff = (this.radio.id !== DEFAULT_SWITCH_ID);

        this.currentState = canSwitchOff ? false : true;
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.On)
            .updateValue(this.currentState);

        if (canSwitchOff) {
            // switching off a radio control means reseting it
            var command = "reset";
            // this.log("[RadioSwitchItem] Send message to '" + this.name + "', id: " + this.radio.id + ", Command: '" + command + "'");
            this.platform.ws.sendCommand(this.uuidActionOriginal, command);
        }
    }

    callback();

};

module.exports = RadioSwitchItem;