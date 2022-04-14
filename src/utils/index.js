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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCrypto = exports.bufferToBase64UrlEncoded = exports.urlDecodeB64 = exports.sha256 = exports.createQueryParams = exports.decode = exports.encode = exports.createRandomString = exports.getCryptoSubtle = exports.getCrypto = exports.runIframe = exports.tokenError = exports.loginError = exports.hasAuthParams = exports.retryPromise = exports.singlePromise = void 0;
var constants_1 = require("../constants");
var errors_1 = require("../errors");
var promise_1 = require("./promise");
Object.defineProperty(exports, "singlePromise", { enumerable: true, get: function () { return promise_1.singlePromise; } });
Object.defineProperty(exports, "retryPromise", { enumerable: true, get: function () { return promise_1.retryPromise; } });
var auth_1 = require("./auth");
Object.defineProperty(exports, "hasAuthParams", { enumerable: true, get: function () { return auth_1.hasAuthParams; } });
Object.defineProperty(exports, "loginError", { enumerable: true, get: function () { return auth_1.loginError; } });
Object.defineProperty(exports, "tokenError", { enumerable: true, get: function () { return auth_1.tokenError; } });
var runIframe = function (authorizeUrl, eventOrigin, timeoutInSeconds) {
    if (timeoutInSeconds === void 0) { timeoutInSeconds = constants_1.DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS; }
    return new Promise(function (res, rej) {
        var iframe = window.document.createElement('iframe');
        iframe.setAttribute('width', '0');
        iframe.setAttribute('height', '0');
        iframe.style.display = 'none';
        var removeIframe = function () {
            if (window.document.body.contains(iframe)) {
                window.document.body.removeChild(iframe);
                window.removeEventListener('message', iframeEventHandler, false);
            }
        };
        // eslint-disable-next-line prefer-const
        var iframeEventHandler;
        var timeoutSetTimeoutId = setTimeout(function () {
            rej(new errors_1.TimeoutError());
            removeIframe();
        }, timeoutInSeconds * 1000);
        iframeEventHandler = function (e) {
            if (e.origin !== eventOrigin)
                return;
            if (!e.data || e.data.type !== 'authorization_response')
                return;
            var eventSource = e.source;
            if (eventSource) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                eventSource.close();
            }
            e.data.response.error
                ? rej(errors_1.GenericError.fromPayload(e.data.response))
                : res(e.data.response);
            clearTimeout(timeoutSetTimeoutId);
            window.removeEventListener('message', iframeEventHandler, false);
            // Delay the removal of the iframe to prevent hanging loading status
            // in Chrome
            setTimeout(removeIframe, constants_1.CLEANUP_IFRAME_TIMEOUT_IN_SECONDS * 1000);
        };
        window.addEventListener('message', iframeEventHandler, false);
        window.document.body.appendChild(iframe);
        iframe.setAttribute('src', authorizeUrl);
    });
};
exports.runIframe = runIframe;
// export const openPopup = (url: string) => {
//   const width = 400;
//   const height = 600;
//   const left = window.screenX + (window.innerWidth - width) / 2;
//   const top = window.screenY + (window.innerHeight - height) / 2;
//   return window.open(
//     url,
//     'auth0:authorize:popup',
//     `left=${left},top=${top},width=${width},height=${height},resizable,scrollbars=yes,status=1`
//   );
// };
// export const runPopup = (config: PopupConfigOptions) => {
//   return new Promise<AuthenticationResult>((resolve, reject) => {
//     // eslint-disable-next-line prefer-const
//     let popupEventListener: EventListenerOrEventListenerObject;
//     // Check each second if the popup is closed triggering a PopupCancelledError
//     const popupTimer = setInterval(() => {
//       if (config.popup && config.popup.closed) {
//         clearInterval(popupTimer);
//         clearTimeout(timeoutId);
//         window.removeEventListener('message', popupEventListener, false);
//         reject(new PopupCancelledError(config.popup));
//       }
//     }, 1000);
//     const timeoutId = setTimeout(() => {
//       clearInterval(popupTimer);
//       reject(new PopupTimeoutError(config.popup));
//       window.removeEventListener('message', popupEventListener, false);
//     }, (config.timeoutInSeconds || DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS) * 1000);
//     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//     // @ts-ignore
//     popupEventListener = function (e: MessageEvent) {
//       if (!e.data || e.data.type !== 'authorization_response') {
//         return;
//       }
//       clearTimeout(timeoutId);
//       clearInterval(popupTimer);
//       window.removeEventListener('message', popupEventListener, false);
//       config.popup.close();
//       if (e.data.response.error) {
//         return reject(GenericError.fromPayload(e.data.response));
//       }
//       resolve(e.data.response);
//     };
//     window.addEventListener('message', popupEventListener);
//   });
// };
var getCrypto = function () {
    //ie 11.x uses msCrypto
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window.crypto || window.msCrypto);
};
exports.getCrypto = getCrypto;
var getCryptoSubtle = function () {
    var crypto = (0, exports.getCrypto)();
    //safari 10.x uses webkitSubtle
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return crypto.subtle || crypto.webkitSubtle;
};
exports.getCryptoSubtle = getCryptoSubtle;
var createRandomString = function () {
    var charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_~.';
    var random = '';
    var randomValues = Array.from((0, exports.getCrypto)().getRandomValues(new Uint8Array(43)));
    randomValues.forEach(function (v) { return (random += charset[v % charset.length]); });
    return random;
};
exports.createRandomString = createRandomString;
var encode = function (value) { return btoa(value); };
exports.encode = encode;
var decode = function (value) { return atob(value); };
exports.decode = decode;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
var createQueryParams = function (params) {
    return Object.keys(params)
        .filter(function (k) { return typeof params[k] !== 'undefined'; })
        .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); })
        .join('&');
};
exports.createQueryParams = createQueryParams;
var sha256 = function (s) { return __awaiter(void 0, void 0, void 0, function () {
    var digestOp;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                digestOp = (0, exports.getCryptoSubtle)().digest({ name: 'SHA-256' }, new TextEncoder().encode(s));
                // msCrypto (IE11) uses the old spec, which is not Promise based
                // https://msdn.microsoft.com/en-us/expression/dn904640(v=vs.71)
                // Instead of returning a promise, it returns a CryptoOperation
                // with a result property in it.
                // As a result, the various events need to be handled in the event that we're
                // working in IE11 (hence the msCrypto check). These events just call resolve
                // or reject depending on their intention.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (window.msCrypto) {
                    return [2 /*return*/, new Promise(function (res, rej) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            digestOp.oncomplete = function (e) {
                                res(e.target.result);
                            };
                            digestOp.onerror = function (e) {
                                rej(e.error);
                            };
                            digestOp.onabort = function () {
                                rej('The digest operation was aborted');
                            };
                        })];
                }
                return [4 /*yield*/, digestOp];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.sha256 = sha256;
var urlEncodeB64 = function (input) {
    var b64Chars = { '+': '-', '/': '_', '=': '' };
    return input.replace(/[+/=]/g, function (m) { return b64Chars[m]; });
};
// https://stackoverflow.com/questions/30106476/
var decodeB64 = function (input) {
    return decodeURIComponent(atob(input)
        .split('')
        .map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    })
        .join(''));
};
var urlDecodeB64 = function (input) {
    return decodeB64(input.replace(/_/g, '/').replace(/-/g, '+'));
};
exports.urlDecodeB64 = urlDecodeB64;
var bufferToBase64UrlEncoded = function (input) {
    var ie11SafeInput = new Uint8Array(input);
    return urlEncodeB64(window.btoa(String.fromCharCode.apply(String, __spreadArray([], __read(Array.from(ie11SafeInput)), false))));
};
exports.bufferToBase64UrlEncoded = bufferToBase64UrlEncoded;
var validateCrypto = function () {
    if (!(0, exports.getCrypto)()) {
        throw new Error('For security reasons, `window.crypto` is required to run `slashauth`.');
    }
    if (typeof (0, exports.getCryptoSubtle)() === 'undefined') {
        throw new Error("\n      slashauth must run on a secure origin.\n    ");
    }
};
exports.validateCrypto = validateCrypto;
//# sourceMappingURL=index.js.map