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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJSON = exports.switchFetch = exports.createAbortController = void 0;
var constants_1 = require("./constants");
var errors_1 = require("./errors");
var createAbortController = function () { return new AbortController(); };
exports.createAbortController = createAbortController;
var dofetch = function (fetchUrl, fetchOptions) { return __awaiter(void 0, void 0, void 0, function () {
    var response;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, fetch(fetchUrl, fetchOptions)];
            case 1:
                response = _b.sent();
                _a = {
                    ok: response.ok
                };
                return [4 /*yield*/, response.json()];
            case 2: return [2 /*return*/, (_a.json = _b.sent(),
                    _a)];
        }
    });
}); };
var fetchWithoutWorker = function (fetchUrl, fetchOptions, timeout) { return __awaiter(void 0, void 0, void 0, function () {
    var controller, timeoutId;
    return __generator(this, function (_a) {
        controller = (0, exports.createAbortController)();
        fetchOptions.signal = controller.signal;
        // The promise will resolve with one of these two promises (the fetch or the timeout), whichever completes first.
        return [2 /*return*/, Promise.race([
                dofetch(fetchUrl, fetchOptions),
                new Promise(function (_, reject) {
                    timeoutId = setTimeout(function () {
                        controller.abort();
                        reject(new Error('Timeout when executing `fetch`'));
                    }, timeout);
                }),
            ]).finally(function () {
                clearTimeout(timeoutId);
            })];
    });
}); };
// const fetchWithWorker = async (
//   fetchUrl: string,
//   audience: string,
//   scope: string,
//   fetchOptions: FetchOptions,
//   timeout: number,
//   worker?: Worker,
//   useFormData?: boolean
// ) => {
//   if (!worker) {
//     return;
//   }
//   return sendMessage(
//     {
//       auth: {
//         audience,
//         scope,
//       },
//       timeout,
//       fetchUrl,
//       fetchOptions,
//       useFormData,
//     },
//     worker
//   );
// };
var switchFetch = function (fetchUrl, audience, scope, fetchOptions, worker, useFormData, timeout
// eslint-disable-next-line @typescript-eslint/no-explicit-any
) {
    if (timeout === void 0) { timeout = constants_1.DEFAULT_FETCH_TIMEOUT_MS; }
    return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // if (worker) {
            //   return fetchWithWorker(
            //     fetchUrl,
            //     audience,
            //     scope,
            //     fetchOptions,
            //     timeout,
            //     worker,
            //     useFormData
            //   );
            // } else {
            //   return fetchWithoutWorker(fetchUrl, fetchOptions, timeout);
            // }
            return [2 /*return*/, fetchWithoutWorker(fetchUrl, fetchOptions, timeout)];
        });
    });
};
exports.switchFetch = switchFetch;
function getJSON(url, timeout, audience, scope, options, worker, useFormData) {
    return __awaiter(this, void 0, void 0, function () {
        var fetchError, response, i, e_1, _a, error, error_description, data, ok, errorMessage;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    fetchError = null;
                    i = 0;
                    _b.label = 1;
                case 1:
                    if (!(i < constants_1.DEFAULT_SILENT_TOKEN_RETRY_COUNT)) return [3 /*break*/, 6];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, (0, exports.switchFetch)(url, audience, scope, options, worker, useFormData, timeout)];
                case 3:
                    response = _b.sent();
                    fetchError = null;
                    return [3 /*break*/, 6];
                case 4:
                    e_1 = _b.sent();
                    // Fetch only fails in the case of a network issue, so should be
                    // retried here. Failure status (4xx, 5xx, etc) return a resolved Promise
                    // with the failure in the body.
                    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
                    if (e_1 instanceof Error || e_1 === null) {
                        fetchError = e_1;
                    }
                    return [3 /*break*/, 5];
                case 5:
                    i++;
                    return [3 /*break*/, 1];
                case 6:
                    if (fetchError) {
                        // unfetch uses XMLHttpRequest under the hood which throws
                        // ProgressEvents on error, which don't have message properties
                        fetchError.message = fetchError.message || 'Failed to fetch';
                        throw fetchError;
                    }
                    _a = response.json, error = _a.error, error_description = _a.error_description, data = __rest(_a, ["error", "error_description"]), ok = response.ok;
                    if (!ok) {
                        errorMessage = error_description || "HTTP error. Unable to fetch ".concat(url);
                        if (error === 'mfa_required') {
                            throw new errors_1.MfaRequiredError(error, errorMessage, data.mfa_token);
                        }
                        throw new errors_1.GenericError(error || 'request_error', errorMessage);
                    }
                    return [2 /*return*/, data];
            }
        });
    });
}
exports.getJSON = getJSON;
//# sourceMappingURL=http.js.map