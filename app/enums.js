function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

// Action Enums
define("actionFood", "0");
define("actionPlay", "1");
define("actionSleep", "2");

define("actionStartYes", "ACTIONSTARTYES");
define("actionStartNo", "ACTIONSTARTNO");

// Command Enums
define("cmdStart", "START");

define("cmd", "CMD");
define("cmdStats", "STATS");
define("cmdPlay", "PLAY");
define("cmdFeed", "FEED");
define("cmdFood", "FOOD");
define("cmdEat", "EAT");
define("cmdSleep", "SLEEP");

define("cmdHelp", "HELP");

// Post Emi,s
define("postEgg0", "Picked Egg 0")
define("postEgg1", "Picked Egg 1")

// Emoji
define("emojiBurger", "🍔")