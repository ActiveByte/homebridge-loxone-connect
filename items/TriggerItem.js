const TriggerItem = function(widget,platform,homebridge) {

    this.platform = platform;
    this.uuidAction = widget.uuidAction;
    TriggerItem.super_.call(this, widget,platform,homebridge);
};

// Register a listener to be notified of changes in this items value
TriggerItem.prototype.initListener = function() {
    this.platform.ws.registerListenerForUUID(this.uuidAction, this.callBack.bind(this));
};

TriggerItem.prototype.callBack = function(value) {
    //function that gets called by the registered ws listener
    //console.log("Got new state for event " + value);

    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.ProgrammableSwitchEvent)
        .setValue(value == '1');
};

TriggerItem.prototype.getOtherServices = function() {
    const otherService = new this.homebridge.hap.Service.StatelessProgrammableSwitch();

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.ProgrammableSwitchEvent);

    return otherService;
};

module.exports = TriggerItem;