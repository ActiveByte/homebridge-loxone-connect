const Sprinklertem = function(widget,platform,homebridge) {
    Sprinklertem.super_.call(this, widget,platform,homebridge);
};

Sprinklertem.prototype.getOtherServices = function () {
    const otherService = new this.homebridge.hap.Service.Valve();
    
    this.item = 'Sprinklers';

    otherService.getCharacteristic(Characteristic.ValveType).updateValue(1);
    
    otherService.getCharacteristic(Characteristic.Active)
    .on('set', this.setItemState.bind(this))


    return otherService;
};

module.exports = Sprinklertem;