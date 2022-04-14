"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryCache = void 0;
var InMemoryCache = /** @class */ (function () {
    function InMemoryCache() {
        this.enclosedCache = (function () {
            var cache = {};
            return {
                set: function (key, entry) {
                    cache[key] = entry;
                },
                get: function (key) {
                    var cacheEntry = cache[key];
                    if (!cacheEntry) {
                        return null;
                    }
                    return cacheEntry;
                },
                remove: function (key) {
                    delete cache[key];
                },
                allKeys: function () {
                    return Object.keys(cache);
                },
            };
        })();
    }
    return InMemoryCache;
}());
exports.InMemoryCache = InMemoryCache;
//# sourceMappingURL=cache-memory.js.map