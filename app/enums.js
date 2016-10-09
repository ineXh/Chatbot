function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

// CVI Status
define("actionFood", 0);
define("actionPlay", 1);
define("actionSleep", 2);