"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RECOVERABLE_ERRORS = exports.DEFAULT_SLASHAUTH_CLIENT = exports.DEFAULT_NOW_PROVIDER = exports.DEFAULT_SESSION_CHECK_EXPIRY_DAYS = exports.INVALID_REFRESH_TOKEN_ERROR_MESSAGE = exports.MISSING_REFRESH_TOKEN_ERROR_MESSAGE = exports.CACHE_LOCATION_LOCAL_STORAGE = exports.CACHE_LOCATION_MEMORY = exports.DEFAULT_FETCH_TIMEOUT_MS = exports.CLEANUP_IFRAME_TIMEOUT_IN_SECONDS = exports.DEFAULT_SILENT_TOKEN_RETRY_COUNT = exports.DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS = void 0;
exports.DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS = 60;
exports.DEFAULT_SILENT_TOKEN_RETRY_COUNT = 3;
exports.CLEANUP_IFRAME_TIMEOUT_IN_SECONDS = 2;
exports.DEFAULT_FETCH_TIMEOUT_MS = 10000;
exports.CACHE_LOCATION_MEMORY = 'memory';
exports.CACHE_LOCATION_LOCAL_STORAGE = 'localstorage';
exports.MISSING_REFRESH_TOKEN_ERROR_MESSAGE = 'The web worker is missing the refresh token';
exports.INVALID_REFRESH_TOKEN_ERROR_MESSAGE = 'invalid refresh token';
/**
 * @ignore
 */
exports.DEFAULT_SESSION_CHECK_EXPIRY_DAYS = 1;
var DEFAULT_NOW_PROVIDER = function () { return Date.now(); };
exports.DEFAULT_NOW_PROVIDER = DEFAULT_NOW_PROVIDER;
exports.DEFAULT_SLASHAUTH_CLIENT = {
    name: 'slashauth-react',
    version: '',
};
exports.RECOVERABLE_ERRORS = [
    'login_required',
    'consent_required',
    'interaction_required',
    'account_selection_required',
    // Strictly speaking the user can't recover from `access_denied` - but they
    // can get more information about their access being denied by logging in
    // interactively.
    'access_denied',
];
//# sourceMappingURL=constants.js.map