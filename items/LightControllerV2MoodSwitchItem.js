"use strict";

var LightControllerV2MoodSwitchItem = function (widget, platform, homebridge) {
    this.platform = platform;
    this.uuidAction = widget.uuidAction;
    this.stateUuidActiveMoods = widget.states.activeMoods;
    this.mood = widget.mood;
    this.defaultMood = widget.defaultMood;
    this.uuidActionOriginal = widget.uuidActionOriginal;

    this.currentState = undefined;

    LightControllerV2MoodSwitchItem.super_.call(this, widget, platform, homebridge);
};

// Register a listener to be notified of changes in this items value
LightControllerV2MoodSwitchItem.prototype.initListener = function () {
    this.platform.ws.registerListenerForUUID(this.stateUuidActiveMoods, this.callBackActiveMoods.bind(this));
};

LightControllerV2MoodSwitchItem.prototype.callBackActiveMoods = function (value) {
    // value is string containing array of active moods eg. "[1,3]"
    const sanitized = value.slice(1, -1).split(",")

    this.currentState = sanitized.some(active => active == this.mood.id) || false;
    // this.log('Mood ' + this.mood.name + ': IsOn? ' + this.currentState);

    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.On)
        .updateValue(this.currentState);
};

LightControllerV2MoodSwitchItem.prototype.getOtherServices = function () {
    var otherService = new this.homebridge.hap.Service.Switch();

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.On)
        .on('set', this.setItemState.bind(this))
        .on('get', this.getItemState.bind(this))

    return otherService;
};

LightControllerV2MoodSwitchItem.prototype.getItemState = function (callback) {
    callback(undefined, this.currentState);
};

LightControllerV2MoodSwitchItem.prototype.setItemState = function (value, callback) {
    if (value == true) {
        // update local state
        this.currentState = true;
        this.otherService
            .getCharacteristic(this.homebridge.hap.Characteristic.On)
            .updateValue(this.currentState);

        // send the mood change command to Loxone
        const command = `changeTo/${this.mood.id}`;
        //this.log("[LightControllerV2MoodSwitch] Send message to " + this.name + "uuidAction: '" + this.uuidActionOriginal + "' Command: '" + command + "'");
        this.platform.ws.sendCommand(this.uuidActionOriginal, command);

    } else {
        if (this.currentState == true) {
            // keep previous state if defaultMood is not available, otherwise switch to it
            this.currentState = this.defaultMood ? false : true;
            this.otherService
                .getCharacteristic(this.homebridge.hap.Characteristic.On)
                .setValue(this.currentState);

            if (this.defaultMood) {
                // send the mood change command to Loxone
                const command = `changeTo/${this.defaultMood.id}`;
                // this.log("[LightControllerV2MoodSwitch] Send message to " + this.name + "uuidAction: '" + this.uuidActionOriginal + "' Command: '" + command + "'");
                this.platform.ws.sendCommand(this.uuidActionOriginal, command);
            }

        }
    }

    callback();

};

module.exports = LightControllerV2MoodSwitchItem;