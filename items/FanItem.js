const request = require("request");

const FanItem = function(widget,platform,homebridge) {
    FanItem.super_.call(this, widget,platform,homebridge);
};

FanItem.prototype.getOtherServices = function() {
    const otherService = new this.homebridge.hap.Service.Fan();

    this.item = 'Fan';

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.On)
        .on('set', this.setItemState.bind(this))
        .on('get', this.getItemState.bind(this))
        .updateValue(this.currentState == '1');

    return otherService;
};

module.exports = FanItem;