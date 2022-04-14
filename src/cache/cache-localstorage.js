"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorageCache = void 0;
var shared_1 = require("./shared");
var LocalStorageCache = /** @class */ (function () {
    function LocalStorageCache() {
    }
    LocalStorageCache.prototype.set = function (key, entry) {
        localStorage.setItem(key, JSON.stringify(entry));
    };
    LocalStorageCache.prototype.get = function (key) {
        var json = window.localStorage.getItem(key);
        if (!json)
            return null;
        try {
            var payload = JSON.parse(json);
            return payload;
        }
        catch (e) {
            return null;
        }
    };
    LocalStorageCache.prototype.remove = function (key) {
        localStorage.removeItem(key);
    };
    LocalStorageCache.prototype.allKeys = function () {
        return Object.keys(window.localStorage).filter(function (key) {
            return key.startsWith(shared_1.CACHE_KEY_PREFIX);
        });
    };
    return LocalStorageCache;
}());
exports.LocalStorageCache = LocalStorageCache;
//# sourceMappingURL=cache-localstorage.js.map