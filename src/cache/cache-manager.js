"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheManager = void 0;
var constants_1 = require("../constants");
var shared_1 = require("./shared");
var DEFAULT_EXPIRY_ADJUSTMENT_SECONDS = 0;
var CacheManager = /** @class */ (function () {
    function CacheManager(cache, keyManifest, nowProvider) {
        this.cache = cache;
        this.keyManifest = keyManifest;
        this.nowProvider = nowProvider;
        this.nowProvider = this.nowProvider || constants_1.DEFAULT_NOW_PROVIDER;
    }
    CacheManager.prototype.get = function (cacheKey, expiryAdjustmentSeconds) {
        var _a;
        if (expiryAdjustmentSeconds === void 0) { expiryAdjustmentSeconds = DEFAULT_EXPIRY_ADJUSTMENT_SECONDS; }
        return __awaiter(this, void 0, void 0, function () {
            var wrappedEntry, keys, matchedKey, now, nowSeconds;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.cache.get(cacheKey.toKey())];
                    case 1:
                        wrappedEntry = _b.sent();
                        if (!!wrappedEntry) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.getCacheKeys()];
                    case 2:
                        keys = _b.sent();
                        if (!keys)
                            return [2 /*return*/];
                        matchedKey = this.matchExistingCacheKey(cacheKey, keys);
                        if (!matchedKey) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.cache.get(matchedKey)];
                    case 3:
                        wrappedEntry = _b.sent();
                        _b.label = 4;
                    case 4:
                        // If we still don't have an entry, exit.
                        if (!wrappedEntry) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.nowProvider()];
                    case 5:
                        now = _b.sent();
                        nowSeconds = Math.floor(now / 1000);
                        if (!(wrappedEntry.expiresAt - expiryAdjustmentSeconds < nowSeconds)) return [3 /*break*/, 10];
                        if (!wrappedEntry.body.refresh_token) return [3 /*break*/, 7];
                        wrappedEntry.body = {
                            refresh_token: wrappedEntry.body.refresh_token,
                        };
                        return [4 /*yield*/, this.cache.set(cacheKey.toKey(), wrappedEntry)];
                    case 6:
                        _b.sent();
                        return [2 /*return*/, wrappedEntry.body];
                    case 7: return [4 /*yield*/, this.cache.remove(cacheKey.toKey())];
                    case 8:
                        _b.sent();
                        return [4 /*yield*/, ((_a = this.keyManifest) === null || _a === void 0 ? void 0 : _a.remove(cacheKey.toKey()))];
                    case 9:
                        _b.sent();
                        return [2 /*return*/];
                    case 10: return [2 /*return*/, wrappedEntry.body];
                }
            });
        });
    };
    CacheManager.prototype.set = function (entry) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, wrappedEntry;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cacheKey = new shared_1.CacheKey({
                            client_id: entry.client_id,
                            scope: entry.scope,
                            audience: entry.audience,
                        });
                        return [4 /*yield*/, this.wrapCacheEntry(entry)];
                    case 1:
                        wrappedEntry = _b.sent();
                        return [4 /*yield*/, this.cache.set(cacheKey.toKey(), wrappedEntry)];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, ((_a = this.keyManifest) === null || _a === void 0 ? void 0 : _a.add(cacheKey.toKey()))];
                    case 3:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    CacheManager.prototype.clear = function (clientId) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var keys;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getCacheKeys()];
                    case 1:
                        keys = _b.sent();
                        /* istanbul ignore next */
                        if (!keys)
                            return [2 /*return*/];
                        return [4 /*yield*/, keys
                                .filter(function (key) { return (clientId ? key.includes(clientId) : true); })
                                .reduce(function (memo, key) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, memo];
                                        case 1:
                                            _a.sent();
                                            return [4 /*yield*/, this.cache.remove(key)];
                                        case 2:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }, Promise.resolve())];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, ((_a = this.keyManifest) === null || _a === void 0 ? void 0 : _a.clear())];
                    case 3:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Note: only call this if you're sure one of our internal (synchronous) caches are being used.
     */
    CacheManager.prototype.clearSync = function (clientId) {
        var _this = this;
        var keys = this.cache.allKeys();
        /* istanbul ignore next */
        if (!keys)
            return;
        keys
            .filter(function (key) { return (clientId ? key.includes(clientId) : true); })
            .forEach(function (key) {
            _this.cache.remove(key);
        });
    };
    CacheManager.prototype.wrapCacheEntry = function (entry) {
        return __awaiter(this, void 0, void 0, function () {
            var now, expiresInTime, expirySeconds;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.nowProvider()];
                    case 1:
                        now = _a.sent();
                        expiresInTime = Math.floor(now / 1000) + entry.expires_in;
                        expirySeconds = Math.min(expiresInTime, entry.decodedToken.claims.exp);
                        return [2 /*return*/, {
                                body: entry,
                                expiresAt: expirySeconds,
                            }];
                }
            });
        });
    };
    CacheManager.prototype.getCacheKeys = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this.keyManifest) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.keyManifest.get()];
                    case 1:
                        _b = (_a = (_c.sent())) === null || _a === void 0 ? void 0 : _a.keys;
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.cache.allKeys()];
                    case 3:
                        _b = _c.sent();
                        _c.label = 4;
                    case 4: return [2 /*return*/, _b];
                }
            });
        });
    };
    /**
     * Finds the corresponding key in the cache based on the provided cache key.
     * The keys inside the cache are in the format {prefix}::{client_id}::{audience}::{scope}.
     * The first key in the cache that satisfies the following conditions is returned
     *  - `prefix` is strict equal to Auth0's internally configured `keyPrefix`
     *  - `client_id` is strict equal to the `cacheKey.client_id`
     *  - `audience` is strict equal to the `cacheKey.audience`
     *  - `scope` contains at least all the `cacheKey.scope` values
     *  *
     * @param keyToMatch The provided cache key
     * @param allKeys A list of existing cache keys
     */
    CacheManager.prototype.matchExistingCacheKey = function (keyToMatch, allKeys) {
        return allKeys.filter(function (key) {
            var cacheKey = shared_1.CacheKey.fromKey(key);
            var scopeSet = new Set(cacheKey.scope && cacheKey.scope.split(' '));
            var scopesToMatch = keyToMatch.scope.split(' ');
            var hasAllScopes = cacheKey.scope &&
                scopesToMatch.reduce(function (acc, current) { return acc && scopeSet.has(current); }, true);
            return (cacheKey.prefix === shared_1.CACHE_KEY_PREFIX &&
                cacheKey.client_id === keyToMatch.client_id &&
                cacheKey.audience === keyToMatch.audience &&
                hasAllScopes);
        })[0];
    };
    return CacheManager;
}());
exports.CacheManager = CacheManager;
//# sourceMappingURL=cache-manager.js.map