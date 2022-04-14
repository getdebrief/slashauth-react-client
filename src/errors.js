"use strict";
/**
 * For context on the istanbul ignore statements below, see:
 * https://github.com/gotwarlost/istanbul/issues/690
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthError = exports.MfaRequiredError = exports.PopupCancelledError = exports.PopupTimeoutError = exports.TimeoutError = exports.AuthenticationError = exports.GenericError = void 0;
/**
 * Thrown when network requests to the Auth server fail.
 */
var GenericError = /** @class */ (function (_super) {
    __extends(GenericError, _super);
    /* istanbul ignore next */
    function GenericError(error, error_description) {
        var _this = _super.call(this, error_description) || this;
        _this.error = error;
        _this.error_description = error_description;
        Object.setPrototypeOf(_this, GenericError.prototype);
        return _this;
    }
    GenericError.fromPayload = function (_a) {
        var error = _a.error, error_description = _a.error_description;
        return new GenericError(error, error_description);
    };
    return GenericError;
}(Error));
exports.GenericError = GenericError;
/**
 * Thrown when handling the redirect callback fails, will be one of SlashAuth's
 */
var AuthenticationError = /** @class */ (function (_super) {
    __extends(AuthenticationError, _super);
    /* istanbul ignore next */
    function AuthenticationError(error, error_description, state, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appState) {
        if (appState === void 0) { appState = null; }
        var _this = _super.call(this, error, error_description) || this;
        _this.state = state;
        _this.appState = appState;
        //https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(_this, AuthenticationError.prototype);
        return _this;
    }
    return AuthenticationError;
}(GenericError));
exports.AuthenticationError = AuthenticationError;
/**
 * Thrown when silent auth times out (usually due to a configuration issue) or
 * when network requests to the Auth server timeout.
 */
var TimeoutError = /** @class */ (function (_super) {
    __extends(TimeoutError, _super);
    /* istanbul ignore next */
    function TimeoutError() {
        var _this = _super.call(this, 'timeout', 'Timeout') || this;
        //https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(_this, TimeoutError.prototype);
        return _this;
    }
    return TimeoutError;
}(GenericError));
exports.TimeoutError = TimeoutError;
/**
 * Error thrown when the login popup times out (if the user does not complete auth)
 */
var PopupTimeoutError = /** @class */ (function (_super) {
    __extends(PopupTimeoutError, _super);
    /* istanbul ignore next */
    function PopupTimeoutError(popup) {
        var _this = _super.call(this) || this;
        _this.popup = popup;
        //https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(_this, PopupTimeoutError.prototype);
        return _this;
    }
    return PopupTimeoutError;
}(TimeoutError));
exports.PopupTimeoutError = PopupTimeoutError;
var PopupCancelledError = /** @class */ (function (_super) {
    __extends(PopupCancelledError, _super);
    /* istanbul ignore next */
    function PopupCancelledError(popup) {
        var _this = _super.call(this, 'cancelled', 'Popup closed') || this;
        _this.popup = popup;
        //https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(_this, PopupCancelledError.prototype);
        return _this;
    }
    return PopupCancelledError;
}(GenericError));
exports.PopupCancelledError = PopupCancelledError;
/**
 * Error thrown when the token exchange results in a `mfa_required` error
 */
var MfaRequiredError = /** @class */ (function (_super) {
    __extends(MfaRequiredError, _super);
    /* istanbul ignore next */
    function MfaRequiredError(error, error_description, mfa_token) {
        var _this = _super.call(this, error, error_description) || this;
        _this.mfa_token = mfa_token;
        //https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(_this, MfaRequiredError.prototype);
        return _this;
    }
    return MfaRequiredError;
}(GenericError));
exports.MfaRequiredError = MfaRequiredError;
/**
 * An OAuth2 error will come from the authorization server and will have at least an `error` property which will
 * be the error code. And possibly an `error_description` property
 *
 * See: https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.3.1.2.6
 */
var OAuthError = /** @class */ (function (_super) {
    __extends(OAuthError, _super);
    function OAuthError(error, error_description) {
        var _this = _super.call(this, error_description || error) || this;
        _this.error = error;
        _this.error_description = error_description;
        return _this;
    }
    return OAuthError;
}(Error));
exports.OAuthError = OAuthError;
//# sourceMappingURL=errors.js.map