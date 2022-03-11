
const ShuttersItem = function(widget,platform,homebridge) {

    this.platform = platform;
    this.uuidAction = widget.uuidAction; //to control a dimmer, use the uuidAction
    this.positionUuid = widget.states.position; //a blind always has a state called position, which is the uuid which will receive the event to read
    this.sladeUuid = widget.states.shadePosition; 
    this.initialValue = true;
    this.initialSlateValue = true;
    this.inControl = false;

    //100 means fully open
    this.currentPosition = 100;
    this.targetPosition = 100;
    this.startedPosition = 100;
    this.currentSlatePosition = 0;
    this.targetSlatePosition = 0;
    this.startedSlatePosition = 0;

    ShuttersItem.super_.call(this, widget,platform,homebridge);

    this.positionState = this.homebridge.hap.Characteristic.PositionState.STOPPED;
};

// Register a listener to be notified of changes in this items value
ShuttersItem.prototype.initListener = function() {
    this.platform.ws.registerListenerForUUID(this.positionUuid, this.positionCallback.bind(this));
    this.platform.ws.registerListenerForUUID(this.sladeUuid, this.slateCallback.bind(this));
};

ShuttersItem.prototype.positionCallback = function(value) {
    //function that gets called by the registered ws listener
    //console.log("Got new state for blind " + value);

    //incomign values from blinds are decimal (0 - 1)
    value *= 100;
    //in Homekit, 100% means OPEN while in Loxone this means CLOSED: reverse
    value = parseInt(100 - value);

    if(this.initialValue) {
        //this is the initial value. therfore, also set current targetValue on the same
        this.targetPosition = value;
        this.initialValue = false;
    }
    //if extenal actor changed the blinds, it's important that we set the targetvalue to the new real situation
    if(!this.inControl) {
        this.targetPosition = value;
    }

    //define states for Homekit
    const delta = Math.abs(parseInt(value) - this.targetPosition);

    let ps = this.homebridge.hap.Characteristic.PositionState.INCREASING;
    if (delta < 3) {
        //blinds don't always stop at the exact position, so take a margin of 3% here
        ps = this.homebridge.hap.Characteristic.PositionState.STOPPED;
    } else if (parseInt(value) > this.targetPosition){
        ps = this.homebridge.hap.Characteristic.PositionState.DECREASING;
    }

    this.currentPosition = value;

    //also make sure this change is directly communicated to HomeKit
    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.PositionState)
        .updateValue(ps);

    this.otherService
       .getCharacteristic(this.homebridge.hap.Characteristic.TargetPosition)
       .updateValue(parseInt(this.targetPosition));

    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.CurrentPosition)
        .updateValue(value);
};

ShuttersItem.prototype.slateCallback = function(value) {
    //function that gets called by the registered ws listener
    //console.log("Got new state for blind " + value);

    //incomign values from blinds are decimal (0 - 1) but HomeKit is from -90 to +90
    value = value * 180 - 90;
    
    value = parseInt(value);

    if(this.initialSlateValue) {
        //this is the initial value. therfore, also set current targetValue on the same
        this.targetSlatePosition = value;
        this.initialSlateValue = false;
    }
    //if extenal actor changed the blinds, it's important that we set the targetvalue to the new real situation
    if(!this.inControl) {
        this.targetSlatePosition = value;
    }

    this.currentPosition = value;

    this.otherService
       .getCharacteristic(this.homebridge.hap.Characteristic.TargetHorizontalTiltAngle)
       .updateValue(parseInt(this.targetSlatePosition));

    this.otherService
        .getCharacteristic(this.homebridge.hap.Characteristic.CurrentHorizontalTiltAngle)
        .updateValue(value);
};

ShuttersItem.prototype.getOtherServices = function() {

    const otherService = new this.homebridge.hap.Service.WindowCovering();

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.CurrentPosition)
        .on('get', this.getItemCurrentPosition.bind(this))
        .updateValue(this.currentPosition);

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.TargetPosition)
        .on('set', this.setItem.bind(this))
        .on('get', this.getItemTargetPosition.bind(this))
        .updateValue(this.currentPosition);

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.CurrentHorizontalTiltAngle)
        .on('get', this.getSlateCurrentPosition.bind(this))
        .updateValue(this.currentSlatePosition);

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.TargetHorizontalTiltAngle)
        .on('set', this.setSlate.bind(this))
        .on('get', this.getSlateTargetPosition.bind(this))
        .updateValue(this.currentSlatePosition);

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.PositionState)
        .on('get', this.getItemPositionState.bind(this))
        .updateValue(this.positionState);

    return otherService;
};

ShuttersItem.prototype.getItemPositionState = function(callback) {
    callback(undefined,this.positionState);
};

ShuttersItem.prototype.getItemTargetPosition = function(callback) {
    callback(undefined,this.targetPosition);
};

ShuttersItem.prototype.getItemCurrentPosition = function(callback) {
    callback(undefined,this.currentPosition);
};

ShuttersItem.prototype.setItem = function(value, callback) {

    //sending new state (pct closed) to loxone
    const self = this;

    //set a flag that we're in control. this way we'll know if the action is coming from Homekit or from external actor (eg Loxone app)
    //this flag is removed after 20 seconds (increase if you have really long or slow blinds ;)
    this.inControl = true;
    setTimeout(() => { self.inControl = false; }, 55000);

    this.startedPosition = this.currentPosition;
    this.targetPosition = parseInt(value);

    this.setBoth(value, this.targetSlatePosition, callback);
};

ShuttersItem.prototype.getSlateTargetPosition = function(callback) {
    callback(undefined,this.targetSlatePosition);
};

ShuttersItem.prototype.getSlateCurrentPosition = function(callback) {
    callback(undefined,this.currentSlatePosition);
};

ShuttersItem.prototype.setSlate = function(value, callback) {

    //sending new state (pct closed) to loxone
    const self = this;

    //set a flag that we're in control. this way we'll know if the action is coming from Homekit or from external actor (eg Loxone app)
    //this flag is removed after 20 seconds (increase if you have really long or slow blinds ;)
    this.inControl = true;
    setTimeout(() => { self.inControl = false; }, 2400);

    this.startedSlatePosition = this.currentSlatePosition;
    this.targetSlatePosition = parseInt(value);

    this.setBoth(this.targetPosition, value, callback);
};

ShuttersItem.prototype.setBoth = function(positionValue, slateValue, callback) {
    let loxonePositionValue = 100 - parseInt(positionValue);

    let loxoneSlateValue = parseInt((slateValue + 90) * 100 / 180);

    let command = `manualPosBlind/${loxonePositionValue}/${loxoneSlateValue}`;

    this.log(`[Shutters] HomeKit - send message to ${this.name}: ${command}`);
    this.platform.ws.sendCommand(this.uuidAction, command);
    callback();
};

module.exports = ShuttersItem;