const request = require("request");

const OutletItem = function(widget,platform,homebridge) {
    OutletItem.super_.call(this, widget,platform,homebridge);
};

OutletItem.prototype.getOtherServices = function() {
    const otherService = new this.homebridge.hap.Service.Outlet();

    this.item = 'Outlet';

    otherService.getCharacteristic(this.homebridge.hap.Characteristic.On)
        .on('set', this.setItemState.bind(this))
        .on('get', this.getItemState.bind(this))
        .updateValue(this.currentState == '1');

    return otherService;
};

module.exports = OutletItem;