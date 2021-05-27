let Accessory, Service, Characteristic, UUIDGen;
const request = require("request");
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
    Utility.addSupportTo(ItemFactory.MotionSensor, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.ContactSensor, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.LightSensor, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.Dimmer, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.Colorpicker, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.Gate, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.Doorbell, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.Jalousie, ItemFactory.AbstractItem);
	Utility.addSupportTo(ItemFactory.TimedSwitch, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.Switch, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.SmokeSensor, ItemFactory.AbstractItem);
    Utility.addSupportTo(ItemFactory.Alarm, ItemFactory.AbstractItem);

    //Add childs of switch
    Utility.addSupportTo(ItemFactory.Lightbulb, ItemFactory.Switch);
    Utility.addSupportTo(ItemFactory.Outlet, ItemFactory.Switch);
    Utility.addSupportTo(ItemFactory.Pushbutton, ItemFactory.Switch);
    
    homebridge.registerPlatform("homebridge-loxoneWs", "LoxoneWs", LoxPlatform);
};

// Platform constructor
function LoxPlatform(log, config) {
    const platform = this;
    this.log = log;
    this.config = config;
    this.protocol = "http";
    
    if (!this.config['host']) throw new Error("Configuration missing: loxone host (please provide the IP address here)");
    if (!this.config['username']) throw new Error("Configuration missing: loxone username");
    if (!this.config['password']) throw new Error("Configuration missing: loxone password");
    
    if (!this.config['port']) this.config['port'] = 80;
    this.host           = config["host"];
    this.port           = config["port"];
    this.username       = config["username"];
    this.password       = config["password"];
    
    //* Options *//
    options = config['options'];

    this.rooms =[];
    if (options['rooms']) {
        this.rooms = options["rooms"];
    }
    
    this.moodSwitches = 'none';
    if (options['moodSwitches']) {
        this.moodSwitches = options["moodSwitches"];
    }

    this.timedswitch_method = "pulse";
    if (options['StairwellSwitch'] == "on") {
        this.timedswitch_method = "on";
    }
    
    this.alarmsystem_method = "delayedon";
    if (options['alarmSystem'] == "on") {
        this.alarmsystem_method = "on";
    }

    this.alarmsystem_trigger = 5;
    if (options['alarmTrigerLevel']) {
        if(options['alarmTrigerLevel'] > 0 && options['alarmTrigerLevel'] < 7){
            this.alarmsystem_trigger = options['alarmTrigerLevel'];
        }else{
            this.log("Info: alarmTrigerLevel must be an integer between 1 and 6");
        }
    }

    //* Alias *//
    const alias = config['alias'];
    
    let aliases = ['Outlet', 'Lighting', 'Doorbell', 'Trigger', 'Contact', 'Motion', 'Brightness', 'Temperature', 'Humidity'];

    aliases.forEach(function(item) {
        if(!alias[item]){
            alias[item] = item;
        }
    })

    this.alias = alias;
    
    //Also make a WS connection
    this.ws = new WSListener(platform);
}

LoxPlatform.prototype.accessories = function(callback) {
    const that = this;
    this.log("Getting Loxone configuration.");
    const itemFactory = new ItemFactory.Factory(this,Homebridge);
    const url = itemFactory.sitemapUrl();
    this.log("Platform - Waiting 8 seconds until initial state is retrieved via WebSocket.");
    setTimeout(() => {
        that.log(`Platform - Retrieving initial config from ${url}`);
        request.get({
            url,
            json: true
        }, (err, response, json) => {
            if (!err && response.statusCode === 200) {
                callback(itemFactory.parseSitemap(json));
            } else {
                that.log("Platform - There was a problem connecting to Loxone.");
            }
        })
    },8000);
};




