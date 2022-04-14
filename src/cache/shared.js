"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheKey = exports.CACHE_KEY_PREFIX = void 0;
exports.CACHE_KEY_PREFIX = '@@auth0spajs@@';
var CacheKey = /** @class */ (function () {
    function CacheKey(data, prefix) {
        if (prefix === void 0) { prefix = exports.CACHE_KEY_PREFIX; }
        this.prefix = prefix;
        this.client_id = data.client_id;
        this.scope = data.scope;
        this.audience = data.audience;
    }
    /**
     * Converts this `CacheKey` instance into a string for use in a cache
     * @returns A string representation of the key
     */
    CacheKey.prototype.toKey = function () {
        return "".concat(this.prefix, "::").concat(this.client_id, "::").concat(this.audience, "::").concat(this.scope);
    };
    /**
     * Converts a cache key string into a `CacheKey` instance.
     * @param key The key to convert
     * @returns An instance of `CacheKey`
     */
    CacheKey.fromKey = function (key) {
        var _a = __read(key.split('::'), 4), prefix = _a[0], client_id = _a[1], audience = _a[2], scope = _a[3];
        return new CacheKey({ client_id: client_id, scope: scope, audience: audience }, prefix);
    };
    /**
     * Utility function to build a `CacheKey` instance from a cache entry
     * @param entry The entry
     * @returns An instance of `CacheKey`
     */
    CacheKey.fromCacheEntry = function (entry) {
        var scope = entry.scope, audience = entry.audience, client_id = entry.client_id;
        return new CacheKey({
            scope: scope,
            audience: audience,
            client_id: client_id,
        });
    };
    return CacheKey;
}());
exports.CacheKey = CacheKey;
//# sourceMappingURL=shared.js.map