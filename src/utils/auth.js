"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenError = exports.loginError = exports.hasAuthParams = void 0;
var errors_1 = require("../errors");
var CODE_RE = /[?&]code=[^&]+/;
var STATE_RE = /[?&]state=[^&]+/;
var ERROR_RE = /[?&]error=[^&]+/;
var hasAuthParams = function (searchParams) {
    if (searchParams === void 0) { searchParams = window.location.search; }
    return (CODE_RE.test(searchParams) || ERROR_RE.test(searchParams)) &&
        STATE_RE.test(searchParams);
};
exports.hasAuthParams = hasAuthParams;
var normalizeErrorFn = function (fallbackMessage) {
    return function (error) {
        if ('error' in error) {
            return new errors_1.OAuthError(error.error, error.error_description);
        }
        if (error instanceof Error) {
            return error;
        }
        return new Error(fallbackMessage);
    };
};
exports.loginError = normalizeErrorFn('Login failed');
exports.tokenError = normalizeErrorFn('Get access token failed');
//# sourceMappingURL=auth.js.map