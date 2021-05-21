const request = require("request");

const DoorBell = function(widget,platform,homebridge) {

    this.platform = platform;
    this.uuidAction = widget.uuidAction;
    this.state = 0;
    this.busy = false;
    this.debounce = 2;

    DoorBell.super_.call(this, widget,platform,homebridge);
};

// Register a listener to be notified of changes in this items value
DoorBell.prototype.initListener = function() {
    this.platform.ws.registerListenerForUUID(this.uuidAction, this.callBack.bind(this));
};
    
DoorBell.prototype.callBack = function(value) {
    //console.log(`Got new state for DoorBell: ${value}`);
    if (value == 1) {
        if (!this.busy) {
            this.busy = true;
            this.otherService.getCharacteristic(this.homebridge.hap.Characteristic.ProgrammableSwitchEvent).updateValue(this.state);
            this.stepState();
        }

        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        
        this.timeout = setTimeout(() => {
            this.busy = false;
            this.timeout = undefined;
        }, this.debounce * 1000);
    }
    
};

DoorBell.prototype.getOtherServices = function() {

    const otherService = new this.homebridge.hap.Service.Doorbell();

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.ProgrammableSwitchEvent)
        .on('get', this.getState.bind(this));

    return otherService;
};

DoorBell.prototype.stepState = function() {
    if (this.state === 1) {
        this.state = 2;
    } else {
        this.state = 1;
    }
};

DoorBell.prototype.getState = function(callback) {
    callback(undefined, this.state);
};

module.exports = DoorBell;