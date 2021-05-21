# homebridge-loxone-connect
Homebridge plugin for controlling Loxone.

❤️ [One-time donation](paypal.me/activebyte)

There are a few variants from the original loxone homebridge plugin,
but they all have the same problem. Most of them are abandoned and they don't work well with RGBWW leds because they only send HSV colors this causes the leds to not use the white leds.
Those are the two main reason that i made this plugin, also i added a lot of fun and useful stuff.

I am currently working on implementing smoke detectors and alarm system. Since i don't have these to test i'm looking for someone who has them and wants them implemented.
Feel free to contact me if interested.

Feature requests are always welcome!

The plugin will be able to communicate with the following items from your Loxone setup:
  - Lights (Switches, Dimmers and RGB/ Smart-actor RGBW leds)
  - Other switches (On/Off, Pushbutton, Timed switch)
  - Sensors (Temperature, Humidty, Light, Motion and Contact)*
  - Doorbell notification*
  - Gates
  - HomeKit trigger*
  - Window blinds (WIP)

*Needs additional configuration, check [assumptions](#assumptions)
The only configuration required is the credentials to your Loxone miniserver.Q

### Prerequisites
[Homebridge](https://github.com/nfarina/homebridge)
Follow all the installation steps there.

### Installation

Install the plugin through npm or download the files from here.

```sh
$ sudo npm install -g homebridge-loxone-connect
```
Or update to latest version when already installed:
```sh
$ sudo npm update -g homebridge-loxone-connect
```

##### Homebridge config.json

Add the platform section to your Homebridge config.json (usually in ~/.homebridge):
```
{
    "bridge": {
        "name": "Homebridge",
        "username": "CA:AA:12:34:56:78",
        "port": 51826,
        "pin": "012-34-567"
    },

    "description": "Homebridge config",

    "platforms": [
        {
            "platform": "LoxoneWs",
            "name": "Loxone",
            "host": "192.168.1.2",
            "port": "80",
            "username": "homebridge",
            "password": "somepassword"
        }
    ]
}
```
Replace fields
* **host** by the IP of your loxone miniserver
* **port** by the port of your miniserver (use 80 if no special port)
* **username** by the Loxone username
* **password** by the Loxone password

I strongly suggest to create a dedicate Loxone user through Loxone Config (eg homebridge). This way you can restrict access to sensitive items or filter out unneeded controls.

### Optional configuration fields in the platform section

**rooms**

To specify an array of interested rooms to filter on. If empty or not given, all elements are used.
Eg: specifying "rooms" : ["Kitchen", "Bedroom"] will limit your bridge to only elements from those 2 rooms. 

**moodSwitches**

Can use Loxone moods which are part of LightControllerV2 elements. (In order to use this, you'll need to [convert](https://www.loxone.com/enen/kb/lighting-controller-v2/) any 'old' LightControllers blocks.)

Has 3 possible values
* none : does not include moods. This is the default in case not given.
* all : include moods as actionable item
* only : only include moods and filter out any other element

**timedSwitch**

Choose the switch behavior of the Stairwell Light Switch.

Has 2 possible values
* Pulse : Normal operation, light will stay on for fixed amount of time. This is the default in case not given.
* On : Light will stay on as long as the switch is enabled.

### Assumptions
To create the correct accessory type from Loxone items, some attribute parsing is required.
Currently these assumptions are made:

**Light switch**
To make a switch appear as a Lightbulb you have to give it the lightning category.
*You can use a different category name as long as the category has the lightning icon.

**Sensors**
To make a sensor you have to use the Virtual Status block.

These sensors can be made with it:
* **Temperature sensor** Name has to start with 'Temperature'  
* **Humidity sensor** Name has to start with 'Humidity'  
* **Motion sensor** Name has to start with 'Motion'  
* **Lux sensor** Name has to start with 'Brightness'  

**Doorbell**
For the doorbell notification we also use the Virtual Status block, the name has to start with 'Doorbell'.
The doorbell will show 'Not compatible' but it will still send the notification.

**HomeKit Trigger**
To make a HomeKit trigger you have to use the Virtual Status block.
The name of the status block has to start with 'Trigger'.
This can be used for Homekit automation like triggering a scene to become active.


The controls will be named like you named them in Loxone. Rename them through the iOS Home app to make it more intuitive for using with Siri. Eg LIGHT_KITCHEN can be renamed to 'main light' and added to room Kitchen. Then you can ask Siri to 'turn on the main light in the kitchen'.

### Limitations

**rooms**
The Homebridge/HAP protocol does currently not allow attaching the Loxone rooms to the accessories. That is a manual action to be done once using the IOS Home app (or the Eve app which is much more user-friendly).

_Special note: organizing into rooms can be done from Eve, but renaming the items should (unfortunately) be done from the IOS Home app. Name changes in Eve are not reflected in Home and thus not known by Siri._

**100 items**
HomeKit has a limit of 100 accessories per bridge. If you have a large Loxone setup, try to filter unneeded items out either through [a dedicated Loxone usergroup](https://github.com/Sroose/homebridge-loxone-ws/issues/27) or in the checkCustomAttrs function.

**pushbuttons**
Since Homekit has no pushbutton concept, I implemented pushbuttons as switches in Homekit. Telling Siri to put them On will send a pulse to the pushbutton. In Homekit, they will appear to be On for a second.

### Problem solving

If you have troubles getting the states on your iOS device, [try removing the files in your 'persists' folder](https://github.com/nfarina/homebridge#my-ios-app-cant-find-homebridge) (usually in ~/.homebridge/persist) and restarting homebridge.


License
----

The plugin is released under MIT license, which means you can do whatever you want with it as long as you give credit.

Credits
----
The original Loxone WS work was done by [Sroose](https://github.com/Sroose/homebridge-loxone-ws)

Attribution goes towards [Tommaso Marchionni](https://github.com/tommasomarchionni). The structure of this code is based on his [openHAB plugin](https://github.com/tommasomarchionni/homebridge-openHAB).

The original HomeKit API work was done by [Khaos Tian](https://github.com/KhaosT) in his [HAP-NodeJS](https://github.com/KhaosT/HAP-NodeJS) project.

The [homebridge](https://github.com/nfarina/homebridge) component on which this plugin is built was created by [Nick Farina](https://github.com/nfarina).

I've made use of the [NodeJS Loxone websocket API](https://github.com/alladdin/node-lox-ws-api) created by [Ladislav Dokulil](https://github.com/alladdin)

Thanks to all [contributors](https://github.com/Sroose/homebridge-loxone-ws/graphs/contributors)!
