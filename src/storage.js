"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionStorage = exports.CookieStorageWithLegacySameSite = exports.CookieStorage = void 0;
var Cookies = __importStar(require("es-cookie"));
/**
 * A storage protocol for marshalling data to/from cookies
 */
exports.CookieStorage = {
    get: function (key) {
        var value = Cookies.get(key);
        if (typeof value === 'undefined') {
            return;
        }
        return JSON.parse(value);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    save: function (key, value, options) {
        var cookieAttributes = {};
        if ('https:' === window.location.protocol) {
            cookieAttributes = {
                secure: true,
                sameSite: 'none',
            };
        }
        if (options === null || options === void 0 ? void 0 : options.daysUntilExpire) {
            cookieAttributes.expires = options.daysUntilExpire;
        }
        if (options === null || options === void 0 ? void 0 : options.cookieDomain) {
            cookieAttributes.domain = options.cookieDomain;
        }
        Cookies.set(key, JSON.stringify(value), cookieAttributes);
    },
    remove: function (key) {
        Cookies.remove(key);
    },
};
/**
 * @ignore
 */
var LEGACY_PREFIX = '_legacy_';
/**
 * Cookie storage that creates a cookie for modern and legacy browsers.
 * See: https://web.dev/samesite-cookie-recipes/#handling-incompatible-clients
 */
exports.CookieStorageWithLegacySameSite = {
    get: function (key) {
        var value = exports.CookieStorage.get(key);
        if (value) {
            return value;
        }
        return exports.CookieStorage.get("".concat(LEGACY_PREFIX).concat(key));
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    save: function (key, value, options) {
        var cookieAttributes = {};
        if ('https:' === window.location.protocol) {
            cookieAttributes = { secure: true };
        }
        if (options === null || options === void 0 ? void 0 : options.daysUntilExpire) {
            cookieAttributes.expires = options.daysUntilExpire;
        }
        Cookies.set("".concat(LEGACY_PREFIX).concat(key), JSON.stringify(value), cookieAttributes);
        exports.CookieStorage.save(key, value, options);
    },
    remove: function (key) {
        exports.CookieStorage.remove(key);
        exports.CookieStorage.remove("".concat(LEGACY_PREFIX).concat(key));
    },
};
/**
 * A storage protocol for marshalling data to/from session storage
 */
exports.SessionStorage = {
    get: function (key) {
        /* istanbul ignore next */
        if (typeof sessionStorage === 'undefined') {
            return;
        }
        var value = sessionStorage.getItem(key);
        if (typeof value === 'undefined' || !value) {
            return;
        }
        return JSON.parse(value);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    save: function (key, value) {
        sessionStorage.setItem(key, JSON.stringify(value));
    },
    remove: function (key) {
        sessionStorage.removeItem(key);
    },
};
//# sourceMappingURL=storage.js.map