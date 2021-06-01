var request = require("request");

var Alarm = function (widget, platform, homebridge) {
    Characteristic = homebridge.hap.Characteristic;

    this.platform = platform;
    this.uuidAction = widget.uuidAction;
    this.stateUuid = widget.states.armed;
    this.stateUuidAlarm = widget.states.level;
    this.alarmsystem_method = platform.alarmsystem_method;
    this.alarmsystem_trigger = platform.alarmsystem_trigger;

    this.targetState = 0;
    this.alarmlevel = 0;

    Alarm.super_.call(this, widget, platform, homebridge);
};

Alarm.prototype.initListener = function () {
    this.platform.ws.registerListenerForUUID(this.stateUuid, this.callBack.bind(this));
    this.platform.ws.registerListenerForUUID(this.stateUuidAlarm, this.alarmTriggered.bind(this));
};

Alarm.prototype.alarmTriggered = function (value) {
    if (value >= this.alarmsystem_trigger && this.targetState != Characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED) {
        this.otherService.updateCharacteristic(this.homebridge.hap.Characteristic.SecuritySystemCurrentState, 4);
    }
}

Alarm.prototype.callBack = function (value) {
    if (value == 0) {
        this.otherService.updateCharacteristic(this.homebridge.hap.Characteristic.SecuritySystemTargetState, 0);
        this.otherService.updateCharacteristic(this.homebridge.hap.Characteristic.SecuritySystemCurrentState, 0);
    } else {
        this.otherService.updateCharacteristic(this.homebridge.hap.Characteristic.SecuritySystemTargetState, 1);
        this.otherService.updateCharacteristic(this.homebridge.hap.Characteristic.SecuritySystemCurrentState, 1);
    }

    this.targetState = value;
}

Alarm.prototype.getOtherServices = function () {
    var otherService = new this.homebridge.hap.Service.SecuritySystem();

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.SecuritySystemTargetState)
        .setProps({
            validValues: [0, 1]
        })
        .on('get', this.getTargetState.bind(this))
        .on('set', this.setTargetState.bind(this));

    return otherService;
};

Alarm.prototype.getTargetState = function (callback) {
    callback(null, this.targetState);
};

Alarm.prototype.setTargetState = function (value, callback) {
    this.updateTargetState(value, callback);
};

Alarm.prototype.updateTargetState = function (state, callback) {

    const command = (state == '1') ? this.alarmsystem_method : 'off';

    this.log("[Alarm] HomeKit - send message to " + this.name + ": " + command);
    this.platform.ws.sendCommand(this.uuidAction, command);

    this.targetState = state;

    callback();
};

module.exports = Alarm;