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
exports.CacheKeyManifest = void 0;
var shared_1 = require("./shared");
var CacheKeyManifest = /** @class */ (function () {
    function CacheKeyManifest(cache, clientId) {
        this.cache = cache;
        this.clientId = clientId;
        this.manifestKey = this.createManifestKeyFrom(this.clientId);
    }
    CacheKeyManifest.prototype.add = function (key) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var keys, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _b = Set.bind;
                        return [4 /*yield*/, this.cache.get(this.manifestKey)];
                    case 1:
                        keys = new (_b.apply(Set, [void 0, ((_a = (_c.sent())) === null || _a === void 0 ? void 0 : _a.keys) || []]))();
                        keys.add(key);
                        return [4 /*yield*/, this.cache.set(this.manifestKey, {
                                keys: Array.from(keys),
                            })];
                    case 2:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    CacheKeyManifest.prototype.remove = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var entry, keys;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.cache.get(this.manifestKey)];
                    case 1:
                        entry = _a.sent();
                        if (!entry) return [3 /*break*/, 5];
                        keys = new Set(entry.keys);
                        keys.delete(key);
                        if (!(keys.size > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.cache.set(this.manifestKey, {
                                keys: Array.from(keys),
                            })];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3: return [4 /*yield*/, this.cache.remove(this.manifestKey)];
                    case 4: return [2 /*return*/, _a.sent()];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    CacheKeyManifest.prototype.get = function () {
        return this.cache.get(this.manifestKey);
    };
    CacheKeyManifest.prototype.clear = function () {
        return this.cache.remove(this.manifestKey);
    };
    CacheKeyManifest.prototype.createManifestKeyFrom = function (clientId) {
        return "".concat(shared_1.CACHE_KEY_PREFIX, "::").concat(clientId);
    };
    return CacheKeyManifest;
}());
exports.CacheKeyManifest = CacheKeyManifest;
//# sourceMappingURL=key-manifest.js.map