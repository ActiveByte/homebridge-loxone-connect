const IrrigationItem = function(widget,platform,homebridge) {
    Characteristic = homebridge.hap.Characteristic;

    this.platform = platform;
    this.widget = widget;
    this.currentState = 0; // will be 0 or 1
    IrrigationItem.super_.call(this, widget,platform,homebridge);
};

// Register a listener to be notified of changes in this items value
IrrigationItem.prototype.initListener = function() {
    //this.platform.ws.registerListenerForUUID(this.stateUuid, this.callBack.bind(this));
    this.platform.ws.registerListenerForUUID(this.widget.states.currentZone, this.callBack.bind(this));
};

IrrigationItem.prototype.callBack = function(currentZone) {
    this.currentState = currentZone !== -1;

    this.otherService.getCharacteristic(Characteristic.Active)
        .updateValue(this.currentState ? Characteristic.Active.ACTIVE : Characteristic.Active.INACTIVE);
    this.otherService.getCharacteristic(Characteristic.InUse)
        .updateValue(this.currentState ? Characteristic.InUse.IN_USE : Characteristic.InUse.NOT_IN_USE);
};

IrrigationItem.prototype.getOtherServices = function() {
    const otherService = new this.homebridge.hap.Service.Valve();

    otherService.getCharacteristic(Characteristic.ValveType).updateValue(Characteristic.ValveType.IRRIGATION);

    otherService.getCharacteristic(Characteristic.Active)
    .on('set', this.setItemState.bind(this))

    return otherService;
};

IrrigationItem.prototype.getItemState = function(callback) {
    //returns true if currentState is 1
    callback(undefined, this.currentState);
};

IrrigationItem.prototype.setItemState = function(value, callback) {

    let command = 0;
    if (value == true) {
        command = 'startForce';
    } else {
        command = 'stop';
    }

    this.log(`[irrigation] HomeKit - send message to ${this.name}: ${command}`);
    this.platform.ws.sendCommand(this.widget.uuidAction, command);
    callback();
};

module.exports = IrrigationItem;