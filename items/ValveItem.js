const ValveItem = function (widget, platform, homebridge) {
    this.platform = platform;
    this.uuidAction = widget.uuidAction; //to control a switch, use the uuidAction
    this.stateUuid = widget.states.active; //a switch always has a state called active, which is the uuid which will receive the event to read
    this.currentState = undefined; //will be 0 or 1 for Switch
    this.autoTimer = undefined;

    ValveItem.super_.call(this, widget, platform, homebridge);
};

// Register a listener to be notified of changes in this items value
ValveItem.prototype.initListener = function () {
    this.platform.ws.registerListenerForUUID(this.stateUuid, this.callBack.bind(this));
};

ValveItem.prototype.callBack = function (value) {
    //console.log("Got new state for sprinkler: " + value);

    this.currentState = value;

    this.otherService.getCharacteristic(this.homebridge.hap.Characteristic.Active).updateValue(this.currentState == '1');
    this.otherService.getCharacteristic(this.homebridge.hap.Characteristic.InUse).updateValue(this.currentState == '1');
};

ValveItem.prototype.getOtherServices = function () {
    const otherService = new this.homebridge.hap.Service.Valve();
    
    this.item = 'Valve';
    
    otherService.getCharacteristic(this.homebridge.hap.Characteristic.ValveType).updateValue(0);
    
    otherService.getCharacteristic(this.homebridge.hap.Characteristic.Active)
    .on('set', this.setItemState.bind(this))

    return otherService;
};

ValveItem.prototype.setItemState = function (value, callback) {
    const command = (value == '1') ? 'On' : 'Off';
    this.log(`[${this.item}] - send message to ${this.name}: ${command}`);
    this.platform.ws.sendCommand(this.uuidAction, command);
    callback();
};

module.exports = ValveItem;