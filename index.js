let Accessory, Service, Characteristic, UUIDGen;
const ItemFactory = require('./libs/ItemFactory.js');
const Utility = require('./libs/Utility.js');
const WSListener = require('./libs/WSListener.js');

module.exports = homebridge => {
    console.log(`homebridge API version: ${homebridge.version}`);

    // Accessory must be created from PlatformAccessory Constructor
    Accessory = homebridge.platformAccessory;

    // Keep refference to the passes API object
    Homebridge = homebridge;

    //Add inheritance of the AbstractItem to the Accessory object
    Utility.addSupportTo(ItemFactory.AbstractItem, Accessory);

    //All other items are child of the abstractItem
    Utility.addSupportTo(ItemFactory.LightControllerV2MoodSwitch, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.Trigger, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.TemperatureSensor, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.HumiditySensor, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.Irrigation, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.MotionSensor, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.ContactSensor, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.LightSensor, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.LeakSensor, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.Dimmer, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.Colorpicker, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.Gate, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.Doorbell, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.Blinds, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.Shutters, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.TimedSwitch, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.Switch, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.SmokeSensor, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.Alarm, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.RadioSwitchItem, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.Lock, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.Valve, ItemFactory.AbstractItem);

    //Add childs of switch
    Utility.addSupportTo(ItemFactory.Lightbulb, ItemFactory.Switch);
    Utility.addSupportTo(ItemFactory.Outlet, ItemFactory.Switch);
    Utility.addSupportTo(ItemFactory.Pushbutton, ItemFactory.Switch);
    Utility.addSupportTo(ItemFactory.Fan, ItemFactory.Switch);

    //Add childs of shower
    Utility.addSupportTo(ItemFactory.Sprinkler, ItemFactory.Valve);

    homebridge.registerPlatform("homebridge-loxone-connect", "LoxoneWs", LoxPlatform);
};

// Platform constructor
function LoxPlatform(log, config) {
    this.log = log;
    this.config = config;
    this.protocol = "http";

    if (!this.config['host']) throw new Error("Configuration missing: loxone host (please provide the IP address here)");
    if (!this.config['username']) throw new Error("Configuration missing: loxone username");
    if (!this.config['password']) throw new Error("Configuration missing: loxone password");

    if (!this.config['port']) this.config['port'] = 80;
    this.host = config["host"];
    this.port = config["port"];
    this.username = config["username"];
    this.password = config["password"];

    //* Options *//
    if (!config['options']) {
        config['options'] = "";
    }
    const options = config['options'];

    this.rooms = [];
    if (options['rooms']) {
        this.rooms = options["rooms"];
    }

    this.moodSwitches = 'none';
    if (options['moodSwitches']) {
        this.moodSwitches = options["moodSwitches"];
    }

    this.radioSwitches = 1;
    if (options['radioSwitches'] !== undefined) {
        this.radioSwitches = options["radioSwitches"];
    }

    this.timedswitch_method = "pulse";
    if (options['stairwellSwitch'] == "on") {
        this.timedswitch_method = "on";
    }

    this.alarmsystem_method = "delayedon";
    if (options['alarmSystem'] == "on") {
        this.alarmsystem_method = "on";
    }

    this.alarmsystem_trigger = 5;
    if (options['alarmTrigerLevel']) {
        if (options['alarmTrigerLevel'] > 0 && options['alarmTrigerLevel'] < 7) {
            this.alarmsystem_trigger = options['alarmTrigerLevel'];
        } else {
            this.log("Info: alarmTrigerLevel must be an integer between 1 and 6");
        }
    }

    this.autoLock = 1;
    if (options['autoLock']) {
        this.autoLock = options['autoLock'];
    }

    this.autoLockDelay = 5;
    if (options['autoLockDelay']) {
        this.autoLockDelay = options['autoLockDelay'];
    }


    //* Alias *//
    this.alias = config['alias'];
}

LoxPlatform.prototype.accessories = async function (callback) {
    const platform = this;

    this.ws = new WSListener(platform);

    while (!this.ws.loxdata) // Wait for json data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
    const itemFactory = new ItemFactory.Factory(this, Homebridge);
    callback(itemFactory.parseSitemap(this.ws.loxdata));
};