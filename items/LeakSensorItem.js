const LeakSensor = function(widget,platform,homebridge) {

    this.platform = platform;
    this.uuidAction = widget.uuidAction;

    LeakSensor.super_.call(this, widget,platform,homebridge);
};

// Register a listener to be notified of changes in this items value
LeakSensor.prototype.initListener = function() {
    this.platform.ws.registerListenerForUUID(this.uuidAction, this.callBack.bind(this));
};
    
LeakSensor.prototype.callBack = function(value) {
    //console.log(`Got new state for LeakSensor: ${value}`);
    this.otherService.getCharacteristic(this.homebridge.hap.Characteristic.LeakDetected).updateValue(value);
};

LeakSensor.prototype.getOtherServices = function() {

    const otherService = new this.homebridge.hap.Service.LeakSensor();

    return otherService;
};

module.exports = LeakSensor;