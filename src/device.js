"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var uuid_1 = require("uuid");
var cache_1 = require("./cache");
var cache = new cache_1.LocalStorageCache();
var DEVICE_ID = '_slashauth-browser-id';
var browserDeviceID = (0, uuid_1.v4)();
var success = false;
try {
    var existing = cache.get(DEVICE_ID);
    if (existing) {
        browserDeviceID = existing;
        success = true;
    }
    // eslint-disable-next-line no-empty
}
catch (_a) { }
if (!success) {
    var browserDeviceID_1 = (0, uuid_1.v4)();
    cache.set(DEVICE_ID, browserDeviceID_1);
}
exports.default = browserDeviceID;
//# sourceMappingURL=device.js.map