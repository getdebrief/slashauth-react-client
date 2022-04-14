"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var browser_tabs_lock_1 = __importDefault(require("browser-tabs-lock"));
var utils_1 = require("./utils");
var scope_1 = require("./scope");
var cache_1 = require("./cache");
var transaction_manager_1 = __importDefault(require("./transaction-manager"));
var jwt_1 = require("./jwt");
var errors_1 = require("./errors");
var storage_1 = require("./storage");
var constants_1 = require("./constants");
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line import/default
var token_worker_ts_1 = __importDefault(require("./worker/token.worker.ts"));
var key_manifest_1 = require("./cache/key-manifest");
var device_1 = __importDefault(require("./device"));
// type GetTokenSilentlyResult = TokenEndpointResponse & {
//   decodedToken: ReturnType<typeof verifyIdToken>;
//   scope: string;
//   oauthTokenScope?: string;
//   audience: string;
// };
/**
 * @ignore
 */
var lock = new browser_tabs_lock_1.default();
/**
 * @ignore
 */
var GET_TOKEN_SILENTLY_LOCK_KEY = 'auth0.lock.getTokenSilently';
/**
 * @ignore
 */
var buildOrganizationHintCookieName = function (clientId) {
    return "auth0.".concat(clientId, ".organization_hint");
};
/**
 * @ignore
 */
var OLD_IS_AUTHENTICATED_COOKIE_NAME = 'auth0.is.authenticated';
/**
 * @ignore
 */
var buildIsAuthenticatedCookieName = function (clientId) {
    return "auth0.".concat(clientId, ".is.authenticated");
};
/**
 * @ignore
 */
var cacheLocationBuilders = {
    memory: function () { return new cache_1.InMemoryCache().enclosedCache; },
    localstorage: function () { return new cache_1.LocalStorageCache(); },
};
/**
 * @ignore
 */
var cacheFactory = function (location) {
    return cacheLocationBuilders[location];
};
/**
 * @ignore
 */
var supportWebWorker = function () { return true; };
/**
 * @ignore
 */
var getTokenIssuer = function (issuer, domainUrl) {
    if (issuer) {
        return issuer.startsWith('https://') ? issuer : "https://".concat(issuer, "/");
    }
    return "".concat(domainUrl, "/");
};
/**
 * @ignore
 */
var getDomain = function (domainUrl) {
    if (!/^https?:\/\//.test(domainUrl)) {
        return "https://".concat(domainUrl);
    }
    return domainUrl;
};
/**
 * @ignore
 */
var getCustomInitialOptions = function (options) {
    var slashAuthClient = options.slashAuthClient, cacheLocation = options.cacheLocation, clientID = options.clientID, domain = options.domain, issuer = options.issuer, leeway = options.leeway, max_age = options.max_age, customParams = __rest(options, ["slashAuthClient", "cacheLocation", "clientID", "domain", "issuer", "leeway", "max_age"]);
    return customParams;
};
/**
 * SlashAuth SDK for Single Page Applications using no-redirect, no popup flow.
 */
var SlashAuthClient = /** @class */ (function () {
    function SlashAuthClient(options) {
        this.options = options;
        typeof window !== 'undefined' && (0, utils_1.validateCrypto)();
        if (options.cache && options.cacheLocation) {
            console.warn('Both `cache` and `cacheLocation` options have been specified in the Auth0Client configuration; ignoring `cacheLocation` and using `cache`.');
        }
        var cache;
        if (options.cache) {
            cache = options.cache;
        }
        else {
            this.cacheLocation = options.cacheLocation || constants_1.CACHE_LOCATION_MEMORY;
            if (!cacheFactory(this.cacheLocation)) {
                throw new Error("Invalid cache location \"".concat(this.cacheLocation, "\""));
            }
            cache = cacheFactory(this.cacheLocation)();
        }
        // this.httpTimeoutMs = options.httpTimeoutInSeconds
        //   ? options.httpTimeoutInSeconds * 1000
        //   : DEFAULT_FETCH_TIMEOUT_MS;
        this.httpTimeoutMs = constants_1.DEFAULT_FETCH_TIMEOUT_MS;
        // this.cookieStorage =
        //   options.legacySameSiteCookie === false
        //     ? CookieStorage
        //     : CookieStorageWithLegacySameSite;
        this.cookieStorage = storage_1.CookieStorageWithLegacySameSite;
        this.orgHintCookieName = buildOrganizationHintCookieName(this.options.clientID);
        this.isAuthenticatedCookieName = buildIsAuthenticatedCookieName(this.options.clientID);
        // this.sessionCheckExpiryDays =
        //   options.sessionCheckExpiryDays || DEFAULT_SESSION_CHECK_EXPIRY_DAYS;
        this.sessionCheckExpiryDays = constants_1.DEFAULT_SESSION_CHECK_EXPIRY_DAYS;
        // const transactionStorage = options.useCookiesForTransactions
        //   ? this.cookieStorage
        //   : SessionStorage;
        var transactionStorage = storage_1.SessionStorage;
        // this.scope = this.options.scope;
        this.scope = '';
        this.transactionManager = new transaction_manager_1.default(transactionStorage, this.options.clientID);
        // this.nowProvider = this.options.nowProvider || DEFAULT_NOW_PROVIDER;
        this.nowProvider = constants_1.DEFAULT_NOW_PROVIDER;
        this.cacheManager = new cache_1.CacheManager(cache, !cache.allKeys
            ? new key_manifest_1.CacheKeyManifest(cache, this.options.clientID)
            : null, this.nowProvider);
        this.domainUrl = getDomain(this.options.domain);
        this.tokenIssuer = getTokenIssuer(this.options.issuer, this.domainUrl);
        // this.defaultScope = getUniqueScopes(
        //   'openid',
        //   this.options?.advancedOptions?.defaultScope !== undefined
        //     ? this.options.advancedOptions.defaultScope
        //     : DEFAULT_SCOPE
        // );
        this.defaultScope = (0, scope_1.getUniqueScopes)('openid');
        // If using refresh tokens, automatically specify the `offline_access` scope.
        // Note we cannot add this to 'defaultScope' above as the scopes are used in the
        // cache keys - changing the order could invalidate the keys
        // if (this.options.useRefreshTokens) {
        //   this.scope = getUniqueScopes(this.scope, 'offline_access');
        // }
        this.scope = (0, scope_1.getUniqueScopes)(this.scope, 'offline_access');
        // Don't use web workers unless using refresh tokens in memory and not IE11
        if (typeof window !== 'undefined' &&
            window.Worker &&
            // this.options.useRefreshTokens &&
            this.cacheLocation === constants_1.CACHE_LOCATION_MEMORY &&
            supportWebWorker()) {
            this.worker = new token_worker_ts_1.default();
        }
        this.customOptions = getCustomInitialOptions(options);
    }
    SlashAuthClient.prototype._url = function (path) {
        var slashAuthClient = encodeURIComponent(btoa(JSON.stringify(this.options.slashAuthClient || constants_1.DEFAULT_SLASHAUTH_CLIENT)));
        return "".concat(this.domainUrl).concat(path, "&slashauthClient=").concat(slashAuthClient);
    };
    SlashAuthClient.prototype._getParams = function (authorizeOptions, state, nonce, code_challenge, redirect_uri) {
        // These options should be excluded from the authorize URL,
        // as they're options for the client and not for the IdP.
        // ** IMPORTANT ** If adding a new client option, include it in this destructure list.
        var _a = this.options, slashAuthClient = _a.slashAuthClient, cacheLocation = _a.cacheLocation, domain = _a.domain, leeway = _a.leeway, loginOptions = __rest(_a, ["slashAuthClient", "cacheLocation", "domain", "leeway"]);
        return __assign(__assign(__assign({}, loginOptions), authorizeOptions), { scope: (0, scope_1.getUniqueScopes)(this.defaultScope, this.scope, 
            // authorizeOptions.scope
            ''), response_type: 'code', response_mode: 'query', state: state, nonce: nonce, 
            // redirect_uri: redirect_uri || this.options.redirect_uri,
            redirect_uri: redirect_uri, code_challenge: code_challenge, code_challenge_method: 'S256' });
    };
    SlashAuthClient.prototype._authorizeUrl = function (authorizeOptions) {
        return this._url("/authorize?".concat((0, utils_1.createQueryParams)(authorizeOptions)));
    };
    SlashAuthClient.prototype._verifyIdToken = function (id_token, nonce, organizationId) {
        return __awaiter(this, void 0, void 0, function () {
            var now;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.nowProvider()];
                    case 1:
                        now = _a.sent();
                        return [2 /*return*/, (0, jwt_1.verify)({
                                iss: this.tokenIssuer,
                                aud: this.options.clientID,
                                id_token: id_token,
                                nonce: nonce,
                                organizationId: organizationId,
                                leeway: this.options.leeway,
                                max_age: this._parseNumber(this.options.max_age),
                                now: now,
                            })];
                }
            });
        });
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SlashAuthClient.prototype._parseNumber = function (value) {
        if (typeof value !== 'string') {
            return value;
        }
        return parseInt(value, 10) || undefined;
    };
    SlashAuthClient.prototype._processOrgIdHint = function (organizationId) {
        if (organizationId) {
            this.cookieStorage.save(this.orgHintCookieName, organizationId, {
                daysUntilExpire: this.sessionCheckExpiryDays,
            });
        }
        else {
            this.cookieStorage.remove(this.orgHintCookieName);
        }
    };
    /**
     * ```js
     * await auth0.buildAuthorizeUrl(options);
     * ```
     *
     * Builds an `/authorize` URL for loginWithRedirect using the parameters
     * provided as arguments. Random and secure `state` and `nonce`
     * parameters will be auto-generated.
     *
     * @param options
     */
    // public async buildAuthorizeUrl(
    //   options: RedirectLoginOptions = {}
    // ): Promise<string> {
    //   const { redirect_uri, appState, ...authorizeOptions } = options;
    //   const stateIn = encode(createRandomString());
    //   const nonceIn = encode(createRandomString());
    //   const code_verifier = createRandomString();
    //   const code_challengeBuffer = await sha256(code_verifier);
    //   const code_challenge = bufferToBase64UrlEncoded(code_challengeBuffer);
    //   const fragment = options.fragment ? `#${options.fragment}` : '';
    //   const params = this._getParams(
    //     authorizeOptions,
    //     stateIn,
    //     nonceIn,
    //     code_challenge,
    //     redirect_uri
    //   );
    //   const url = this._authorizeUrl(params);
    //   const organizationId = options.organization || this.options.organization;
    //   this.transactionManager.create({
    //     nonce: nonceIn,
    //     code_verifier,
    //     appState,
    //     scope: params.scope,
    //     audience: params.audience || 'default',
    //     redirect_uri: params.redirect_uri,
    //     state: stateIn,
    //     ...(organizationId && { organizationId }),
    //   });
    //   return url + fragment;
    // }
    /**
     * ```js
     * try {
     *  await auth0.loginWithPopup(options);
     * } catch(e) {
     *  if (e instanceof PopupCancelledError) {
     *    // Popup was closed before login completed
     *  }
     * }
     * ```
     *
     * Opens a popup with the `/authorize` URL using the parameters
     * provided as arguments. Random and secure `state` and `nonce`
     * parameters will be auto-generated. If the response is successful,
     * results will be valid according to their expiration times.
     *
     * IMPORTANT: This method has to be called from an event handler
     * that was started by the user like a button click, for example,
     * otherwise the popup will be blocked in most browsers.
     *
     * @param options
     * @param config
     */
    // public async loginWithPopup(
    //   options?: PopupLoginOptions,
    //   config?: PopupConfigOptions
    // ) {
    //   options = options || {};
    //   config = config || {};
    //   if (!config.popup) {
    //     config.popup = openPopup('');
    //     if (!config.popup) {
    //       throw new Error(
    //         'Unable to open a popup for loginWithPopup - window.open returned `null`'
    //       );
    //     }
    //   }
    //   const { ...authorizeOptions } = options;
    //   const stateIn = encode(createRandomString());
    //   const nonceIn = encode(createRandomString());
    //   const code_verifier = createRandomString();
    //   const code_challengeBuffer = await sha256(code_verifier);
    //   const code_challenge = bufferToBase64UrlEncoded(code_challengeBuffer);
    //   const params = this._getParams(
    //     authorizeOptions,
    //     stateIn,
    //     nonceIn,
    //     code_challenge,
    //     this.options.redirect_uri || window.location.origin
    //   );
    //   const url = this._authorizeUrl({
    //     ...params,
    //     response_mode: 'web_message',
    //   });
    //   config.popup.location.href = url;
    //   const codeResult = await runPopup({
    //     ...config,
    //     timeoutInSeconds:
    //       config.timeoutInSeconds ||
    //       this.options.authorizeTimeoutInSeconds ||
    //       DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS,
    //   });
    //   if (stateIn !== codeResult.state) {
    //     throw new Error('Invalid state');
    //   }
    //   const authResult = await oauthToken(
    //     {
    //       audience: params.audience,
    //       scope: params.scope,
    //       baseUrl: this.domainUrl,
    //       client_id: this.options.client_id,
    //       code_verifier,
    //       code: codeResult.code,
    //       grant_type: 'authorization_code',
    //       redirect_uri: params.redirect_uri,
    //       auth0Client: this.options.auth0Client,
    //       useFormData: this.options.useFormData,
    //       timeout: this.httpTimeoutMs,
    //     } as OAuthTokenOptions,
    //     this.worker
    //   );
    //   const organizationId = options.organization || this.options.organization;
    //   const decodedToken = await this._verifyIdToken(
    //     authResult.id_token,
    //     nonceIn,
    //     organizationId
    //   );
    //   const cacheEntry = {
    //     ...authResult,
    //     decodedToken,
    //     scope: params.scope,
    //     audience: params.audience || 'default',
    //     client_id: this.options.client_id,
    //   };
    //   await this.cacheManager.set(cacheEntry);
    //   this.cookieStorage.save(this.isAuthenticatedCookieName, true, {
    //     daysUntilExpire: this.sessionCheckExpiryDays,
    //     cookieDomain: this.options.cookieDomain,
    //   });
    //   this._processOrgIdHint(decodedToken.claims.org_id);
    // }
    /**
     * ```js
     * const user = await slashauth.getUser();
     * ```
     *
     * Returns the user information if available (decoded
     * from the `id_token`).
     *
     * If you provide an audience or scope, they should match an existing Access Token
     * (the SDK stores a corresponding ID Token with every Access Token, and uses the
     * scope and audience to look up the ID Token)
     *
     * @typeparam TUser The type to return, has to extend {@link User}.
     * @param options
     */
    SlashAuthClient.prototype.getAccount = function (options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var audience, scope, cache;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        audience = options.audience || 'default';
                        scope = (0, scope_1.getUniqueScopes)(this.defaultScope, this.scope, options.scope);
                        return [4 /*yield*/, this.cacheManager.get(new cache_1.CacheKey({
                                client_id: this.options.clientID,
                                audience: audience,
                                scope: scope,
                            }))];
                    case 1:
                        cache = _a.sent();
                        return [2 /*return*/, cache && cache.decodedToken && cache.decodedToken.user];
                }
            });
        });
    };
    /**
     * ```js
     * const claims = await auth0.getIdTokenClaims();
     * ```
     *
     * Returns all claims from the id_token if available.
     *
     * If you provide an audience or scope, they should match an existing Access Token
     * (the SDK stores a corresponding ID Token with every Access Token, and uses the
     * scope and audience to look up the ID Token)
     *
     * @param options
     */
    SlashAuthClient.prototype.getIdTokenClaims = function (options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var audience, scope, cache;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        audience = options.audience || 'default';
                        scope = (0, scope_1.getUniqueScopes)(this.defaultScope, this.scope, options.scope);
                        return [4 /*yield*/, this.cacheManager.get(new cache_1.CacheKey({
                                client_id: this.options.clientID,
                                audience: audience,
                                scope: scope,
                            }))];
                    case 1:
                        cache = _a.sent();
                        return [2 /*return*/, cache && cache.decodedToken && cache.decodedToken.claims];
                }
            });
        });
    };
    /**
     * ```js
     * await auth0.loginWithRedirect(options);
     * ```
     *
     * Performs a redirect to `/authorize` using the parameters
     * provided as arguments. Random and secure `state` and `nonce`
     * parameters will be auto-generated.
     *
     * @param options
     */
    // public async loginWithRedirect<TAppState = any>(
    //   options: RedirectLoginOptions<TAppState> = {}
    // ) {
    //   const { redirectMethod, ...urlOptions } = options;
    //   const url = await this.buildAuthorizeUrl(urlOptions);
    //   window.location[redirectMethod || 'assign'](url);
    // }
    /**
     * After the browser redirects back to the callback page,
     * call `handleRedirectCallback` to handle success and error
     * responses from Auth0. If the response is successful, results
     * will be valid according to their expiration times.
     */
    // public async handleRedirectCallback<TAppState = any>(
    //   url: string = window.location.href
    // ): Promise<RedirectLoginResult<TAppState>> {
    //   const queryStringFragments = url.split('?').slice(1);
    //   if (queryStringFragments.length === 0) {
    //     throw new Error('There are no query params available for parsing.');
    //   }
    //   const { state, code, error, error_description } = parseQueryResult(
    //     queryStringFragments.join('')
    //   );
    //   const transaction = this.transactionManager.get();
    //   if (!transaction) {
    //     throw new Error('Invalid state');
    //   }
    //   this.transactionManager.remove();
    //   if (error) {
    //     throw new AuthenticationError(
    //       error,
    //       error_description,
    //       state,
    //       transaction.appState
    //     );
    //   }
    //   // Transaction should have a `code_verifier` to do PKCE for CSRF protection
    //   if (
    //     !transaction.code_verifier ||
    //     (transaction.state && transaction.state !== state)
    //   ) {
    //     throw new Error('Invalid state');
    //   }
    //   const tokenOptions = {
    //     audience: transaction.audience,
    //     scope: transaction.scope,
    //     baseUrl: this.domainUrl,
    //     client_id: this.options.client_id,
    //     code_verifier: transaction.code_verifier,
    //     grant_type: 'authorization_code',
    //     code,
    //     auth0Client: this.options.auth0Client,
    //     useFormData: this.options.useFormData,
    //     timeout: this.httpTimeoutMs,
    //   } as OAuthTokenOptions;
    //   // some old versions of the SDK might not have added redirect_uri to the
    //   // transaction, we dont want the key to be set to undefined.
    //   if (undefined !== transaction.redirect_uri) {
    //     tokenOptions.redirect_uri = transaction.redirect_uri;
    //   }
    //   const authResult = await oauthToken(tokenOptions, this.worker);
    //   const decodedToken = await this._verifyIdToken(
    //     authResult.id_token,
    //     transaction.nonce,
    //     transaction.organizationId
    //   );
    //   await this.cacheManager.set({
    //     ...authResult,
    //     decodedToken,
    //     audience: transaction.audience,
    //     scope: transaction.scope,
    //     ...(authResult.scope ? { oauthTokenScope: authResult.scope } : null),
    //     client_id: this.options.client_id,
    //   });
    //   this.cookieStorage.save(this.isAuthenticatedCookieName, true, {
    //     daysUntilExpire: this.sessionCheckExpiryDays,
    //     cookieDomain: this.options.cookieDomain,
    //   });
    //   this._processOrgIdHint(decodedToken.claims.org_id);
    //   return {
    //     appState: transaction.appState,
    //   };
    // }
    /**
     * ```js
     * await slashauth.checkSession();
     * ```
     *
     * Check if the user is logged in using `getTokenSilently`. The difference
     * with `getTokenSilently` is that this doesn't return a token, but it will
     * pre-fill the token cache.
     *
     * This method also heeds the `slashauth.{clientId}.is.authenticated` cookie, as an optimization
     *  to prevent calling Auth0 unnecessarily. If the cookie is not present because
     * there was no previous login (or it has expired) then tokens will not be refreshed.
     *
     * It should be used for silently logging in the user when you instantiate the
     * `SlashAuthClient` constructor. You should not need this if you are using the
     * `createSlashAuthClient` factory.
     *
     * **Note:** the cookie **may not** be present if running an app using a private tab, as some
     * browsers clear JS cookie data and local storage when the tab or page is closed, or on page reload. This effectively
     * means that `checkSession` could silently return without authenticating the user on page refresh when
     * using a private tab, despite having previously logged in. As a workaround, use `getTokenSilently` instead
     * and handle the possible `login_required` error.
     *
     * @param options
     */
    SlashAuthClient.prototype.checkSession = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.cookieStorage.get(this.isAuthenticatedCookieName)) {
                            if (!this.cookieStorage.get(OLD_IS_AUTHENTICATED_COOKIE_NAME)) {
                                return [2 /*return*/];
                            }
                            else {
                                // Migrate the existing cookie to the new name scoped by client ID
                                this.cookieStorage.save(this.isAuthenticatedCookieName, true, {
                                    daysUntilExpire: this.sessionCheckExpiryDays,
                                    cookieDomain: this.options.cookieDomain,
                                });
                                this.cookieStorage.remove(OLD_IS_AUTHENTICATED_COOKIE_NAME);
                            }
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.getTokenSilently(options)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        if (!constants_1.RECOVERABLE_ERRORS.includes(error_1.error)) {
                            throw error_1;
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetches a new access token, and either returns just the access token (the default) or the response from the /oauth/token endpoint, depending on the `detailedResponse` option.
     *
     * ```js
     * const token = await slashauth.getTokenSilently(options);
     * ```
     *
     * If there's a valid token stored and it has more than 60 seconds
     * remaining before expiration, return the token. Otherwise, attempt
     * to obtain a new token.
     *
     * A new token will be obtained either by opening an iframe or a
     * refresh token (if `useRefreshTokens` is `true`)
     * If iframes are used, opens an iframe with the `/authorize` URL
     * using the parameters provided as arguments. Random and secure `state`
     * and `nonce` parameters will be auto-generated. If the response is successful,
     * results will be validated according to their expiration times.
     *
     * If refresh tokens are used, the token endpoint is called directly with the
     * 'refresh_token' grant. If no refresh token is available to make this call,
     * the SDK falls back to using an iframe to the '/authorize' URL.
     *
     * This method may use a web worker to perform the token call if the in-memory
     * cache is used.
     *
     * If an `audience` value is given to this function, the SDK always falls
     * back to using an iframe to make the token exchange.
     *
     * Note that in all cases, falling back to an iframe requires access to
     * the `auth0` cookie.
     *
     * @param options
     */
    SlashAuthClient.prototype.getTokenSilently = function (options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, ignoreCache, getTokenOptions;
            var _this = this;
            return __generator(this, function (_b) {
                _a = __assign(__assign({ audience: this.options.audience, ignoreCache: false }, options), { scope: (0, scope_1.getUniqueScopes)(this.defaultScope, this.scope, options.scope) }), ignoreCache = _a.ignoreCache, getTokenOptions = __rest(_a, ["ignoreCache"]);
                return [2 /*return*/, (0, utils_1.singlePromise)(function () {
                        return _this._getTokenSilently(__assign({ ignoreCache: ignoreCache }, getTokenOptions));
                    }, "".concat(this.options.clientID, "::").concat(getTokenOptions.audience, "::").concat(getTokenOptions.scope))];
            });
        });
    };
    SlashAuthClient.prototype._getTokenSilently = function (options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var ignoreCache, getTokenOptions, entry, entry;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ignoreCache = options.ignoreCache, getTokenOptions = __rest(options, ["ignoreCache"]);
                        if (!!ignoreCache) return [3 /*break*/, 2];
                        return [4 /*yield*/, this._getEntryFromCache({
                                scope: getTokenOptions.scope,
                                audience: getTokenOptions.audience || 'default',
                                client_id: this.options.clientID,
                                getDetailedEntry: options.detailedResponse,
                            })];
                    case 1:
                        entry = _a.sent();
                        if (entry) {
                            return [2 /*return*/, entry];
                        }
                        _a.label = 2;
                    case 2: return [4 /*yield*/, (0, utils_1.retryPromise)(function () { return lock.acquireLock(GET_TOKEN_SILENTLY_LOCK_KEY, 5000); }, 10)];
                    case 3:
                        if (!_a.sent()) return [3 /*break*/, 10];
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, , 7, 9]);
                        if (!!ignoreCache) return [3 /*break*/, 6];
                        return [4 /*yield*/, this._getEntryFromCache({
                                scope: getTokenOptions.scope,
                                audience: getTokenOptions.audience || 'default',
                                client_id: this.options.clientID,
                                getDetailedEntry: options.detailedResponse,
                            })];
                    case 5:
                        entry = _a.sent();
                        if (entry) {
                            return [2 /*return*/, entry];
                        }
                        _a.label = 6;
                    case 6: 
                    // TODO(ned)
                    // const authResult = this.options.useRefreshTokens
                    //   ? await this._getTokenUsingRefreshToken(getTokenOptions)
                    //   : await this._getTokenFromIFrame(getTokenOptions);
                    // const authResult = await this._getTokenUsingRefreshToken(
                    //   getTokenOptions
                    // );
                    // const authResult = {};
                    // await this.cacheManager.set({
                    //   client_id: this.options.clientID,
                    //   ...authResult,
                    // });
                    // this.cookieStorage.save(this.isAuthenticatedCookieName, true, {
                    //   daysUntilExpire: this.sessionCheckExpiryDays,
                    //   cookieDomain: this.options.cookieDomain,
                    // });
                    // if (options.detailedResponse) {
                    //   const { id_token, access_token, oauthTokenScope, expires_in } =
                    //     authResult;
                    //   return {
                    //     id_token,
                    //     access_token,
                    //     ...(oauthTokenScope ? { scope: oauthTokenScope } : null),
                    //     expires_in,
                    //   };
                    // }
                    // return authResult.access_token;
                    throw new Error('Not implemented');
                    case 7: return [4 /*yield*/, lock.releaseLock(GET_TOKEN_SILENTLY_LOCK_KEY)];
                    case 8:
                        _a.sent();
                        return [7 /*endfinally*/];
                    case 9: return [3 /*break*/, 11];
                    case 10: throw new errors_1.TimeoutError();
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     *
     * @returns
     */
    SlashAuthClient.prototype.loginNoRedirectNoPopup = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var authorizeOptions, stateIn, nonceIn, code_verifier, code_challengeBuffer, code_challenge, params, queryParameters, requestURL, authorizeTimeout, authResult, decodedToken, cacheEntry;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        authorizeOptions = __rest(options, []);
                        stateIn = (0, utils_1.encode)((0, utils_1.createRandomString)());
                        nonceIn = (0, utils_1.encode)((0, utils_1.createRandomString)());
                        code_verifier = (0, utils_1.createRandomString)();
                        return [4 /*yield*/, (0, utils_1.sha256)(code_verifier)];
                    case 1:
                        code_challengeBuffer = _a.sent();
                        code_challenge = (0, utils_1.bufferToBase64UrlEncoded)(code_challengeBuffer);
                        params = this._getParams(authorizeOptions, stateIn, nonceIn, code_challenge, this.options.redirect_uri || window.location.origin);
                        queryParameters = {
                            address: options.address,
                            signature: options.signature,
                            deviceID: device_1.default,
                            clientID: this.options.clientID,
                        };
                        requestURL = "".concat(getDomain(this.domainUrl), "/loginWithSignedNonce?").concat((0, utils_1.createQueryParams)(queryParameters));
                        authorizeTimeout = options.timeoutInSeconds;
                        return [4 /*yield*/, (0, utils_1.runIframe)(requestURL, this.domainUrl, authorizeTimeout)];
                    case 2:
                        authResult = _a.sent();
                        return [4 /*yield*/, this._verifyIdToken(authResult.id_token, nonceIn)];
                    case 3:
                        decodedToken = _a.sent();
                        cacheEntry = __assign(__assign({}, authResult), { decodedToken: decodedToken, scope: params.scope, audience: params.audience || 'default', client_id: this.options.client_id });
                        return [4 /*yield*/, this.cacheManager.set(cacheEntry)];
                    case 4:
                        _a.sent();
                        this.cookieStorage.save(this.isAuthenticatedCookieName, true, {
                            daysUntilExpire: this.sessionCheckExpiryDays,
                            cookieDomain: this.options.cookieDomain,
                        });
                        this._processOrgIdHint(decodedToken.claims.org_id);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * ```js
     * const token = await slashauth.getTokenWithPopup(options);
     * ```
     * Opens a popup with the `/authorize` URL using the parameters
     * provided as arguments. Random and secure `state` and `nonce`
     * parameters will be auto-generated. If the response is successful,
     * results will be valid according to their expiration times.
     *
     * @param options
     * @param config
     */
    // public async getTokenWithPopup(
    //   options: GetTokenWithPopupOptions = {},
    //   config: PopupConfigOptions = {}
    // ) {
    //   options.audience = options.audience || this.options.audience;
    //   options.scope = getUniqueScopes(
    //     this.defaultScope,
    //     this.scope,
    //     options.scope
    //   );
    //   config = {
    //     ...DEFAULT_POPUP_CONFIG_OPTIONS,
    //     ...config,
    //   };
    //   await this.loginWithPopup(options, config);
    //   const cache = await this.cacheManager.get(
    //     new CacheKey({
    //       scope: options.scope,
    //       audience: options.audience || 'default',
    //       client_id: this.options.client_id,
    //     })
    //   );
    //   return cache.access_token;
    // }
    /**
     * ```js
     * const isAuthenticated = await auth0.isAuthenticated();
     * ```
     *
     * Returns `true` if there's valid information stored,
     * otherwise returns `false`.
     *
     */
    SlashAuthClient.prototype.isAuthenticated = function () {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getAccount()];
                    case 1:
                        user = _a.sent();
                        return [2 /*return*/, !!user];
                }
            });
        });
    };
    /**
     * ```js
     * await auth0.buildLogoutUrl(options);
     * ```
     *
     * Builds a URL to the logout endpoint using the parameters provided as arguments.
     * @param options
     */
    SlashAuthClient.prototype.buildLogoutUrl = function (options) {
        if (options === void 0) { options = {}; }
        if (options.client_id !== null) {
            options.client_id = options.client_id || this.options.clientID;
        }
        else {
            delete options.client_id;
        }
        var logoutOptions = __rest(options, []);
        var url = this._url("/logout?".concat((0, utils_1.createQueryParams)(logoutOptions)));
        return url;
    };
    /**
     * ```js
     * slashauth.logout();
     * ```
     *
     * Clears the application session and performs a redirect to `/v2/logout`, using
     * the parameters provided as arguments, to clear the Auth0 session.
     *
     * **Note:** If you are using a custom cache, and specifying `localOnly: true`, and you want to perform actions or read state from the SDK immediately after logout, you should `await` the result of calling `logout`.
     *
     * If the `federated` option is specified it also clears the Identity Provider session.
     * If the `localOnly` option is specified, it only clears the application session.
     * It is invalid to set both the `federated` and `localOnly` options to `true`,
     * and an error will be thrown if you do.
     * [Read more about how Logout works at Auth0](https://auth0.com/docs/logout).
     *
     * @param options
     */
    SlashAuthClient.prototype.logout = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var localOnly = options.localOnly, logoutOptions = __rest(options, ["localOnly"]);
        // if (localOnly && logoutOptions.federated) {
        //   throw new Error(
        //     'It is invalid to set both the `federated` and `localOnly` options to `true`'
        //   );
        // }
        var postCacheClear = function () {
            _this.cookieStorage.remove(_this.orgHintCookieName);
            _this.cookieStorage.remove(_this.isAuthenticatedCookieName);
            if (localOnly) {
                return;
            }
            var url = _this.buildLogoutUrl(logoutOptions);
            window.location.assign(url);
        };
        if (this.options.cache) {
            return this.cacheManager.clear().then(function () { return postCacheClear(); });
        }
        else {
            this.cacheManager.clearSync();
            postCacheClear();
        }
    };
    // private async _getTokenFromIFrameNonPKCE(
    //   options: GetTokenSilentlyOptions
    // ): Promise<GetTokenSilentlyResult> {
    //   const stateIn = encode(createRandomString());
    //   const nonceIn = encode(createRandomString());
    //   const code_verifier = createRandomString();
    //   const code_challengeBuffer = await sha256(code_verifier);
    //   const code_challenge = bufferToBase64UrlEncoded(code_challengeBuffer);
    //   const { detailedResponse, ...withoutClientOptions } = options;
    //   const requestURL = `${getDomain(this.domainUrl)}/loginWithSignedNonce`;
    //   const params = this._getParams(
    //     withoutClientOptions,
    //     stateIn,
    //     nonce,
    //     code_challenge,
    //     ''
    //   );
    //   const queryInput = {
    //     address:
    //   }
    // }
    // private async _getTokenFromIFrame(
    //   options: GetTokenSilentlyOptions
    // ): Promise<GetTokenSilentlyResult> {
    //   const stateIn = encode(createRandomString());
    //   const nonceIn = encode(createRandomString());
    //   const code_verifier = createRandomString();
    //   const code_challengeBuffer = await sha256(code_verifier);
    //   const code_challenge = bufferToBase64UrlEncoded(code_challengeBuffer);
    //   const { detailedResponse, ...withoutClientOptions } = options;
    //   const params = this._getParams(
    //     withoutClientOptions,
    //     stateIn,
    //     nonceIn,
    //     code_challenge,
    //     options.redirect_uri ||
    //       // this.options.redirect_uri ||
    //       window.location.origin
    //   );
    //   // const orgIdHint = this.cookieStorage.get<string>(this.orgHintCookieName);
    //   // if (orgIdHint && !params.organization) {
    //   //   params.organization = orgIdHint;
    //   // }
    //   const url = this._authorizeUrl({
    //     ...params,
    //     // prompt: 'none',
    //     response_mode: 'web_message',
    //   });
    //   try {
    //     // When a browser is running in a Cross-Origin Isolated context, using iframes is not possible.
    //     // It doesn't throw an error but times out instead, so we should exit early and inform the user about the reason.
    //     // https://developer.mozilla.org/en-US/docs/Web/API/crossOriginIsolated
    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     if ((window as any).crossOriginIsolated) {
    //       throw new GenericError(
    //         'login_required',
    //         'The application is running in a Cross-Origin Isolated context, silently retrieving a token without refresh token is not possible.'
    //       );
    //     }
    //     const authorizeTimeout = options.timeoutInSeconds;
    //     // | this.options.authorizeTimeoutInSeconds;
    //     const codeResult = await runIframe(url, this.domainUrl, authorizeTimeout);
    //     if (stateIn !== codeResult.state) {
    //       throw new Error('Invalid state');
    //     }
    //     const {
    //       scope,
    //       audience,
    //       redirect_uri,
    //       ignoreCache,
    //       timeoutInSeconds,
    //       detailedResponse,
    //       ...customOptions
    //     } = options;
    //     const tokenResult = await oauthToken(
    //       {
    //         ...this.customOptions,
    //         ...customOptions,
    //         scope,
    //         audience,
    //         baseUrl: this.domainUrl,
    //         client_id: this.options.clientID,
    //         code_verifier,
    //         code: codeResult.code,
    //         grant_type: 'authorization_code',
    //         redirect_uri: params.redirect_uri,
    //         slashAuthClient: this.options.slashAuthClient,
    //         timeout: customOptions.timeout || this.httpTimeoutMs,
    //       } as OAuthTokenOptions,
    //       this.worker
    //     );
    //     const decodedToken = await this._verifyIdToken(
    //       tokenResult.id_token,
    //       nonceIn
    //     );
    //     this._processOrgIdHint(decodedToken.claims.org_id);
    //     return {
    //       ...tokenResult,
    //       decodedToken,
    //       scope: params.scope,
    //       oauthTokenScope: tokenResult.scope,
    //       // audience: params.audience || 'default',
    //       audience: 'default',
    //     };
    //   } catch (e) {
    //     if (e.error === 'login_required') {
    //       this.logout({
    //         localOnly: true,
    //       });
    //     }
    //     throw e;
    //   }
    // }
    // private async _getTokenUsingRefreshToken(
    //   options: GetTokenSilentlyOptions
    // ): Promise<GetTokenSilentlyResult> {
    //   options.scope = getUniqueScopes(
    //     this.defaultScope,
    //     // this.options.scope,
    //     options.scope
    //   );
    //   const cache = await this.cacheManager.get(
    //     new CacheKey({
    //       scope: options.scope,
    //       audience: options.audience || 'default',
    //       client_id: this.options.clientID,
    //     })
    //   );
    //   // If you don't have a refresh token in memory
    //   // and you don't have a refresh token in web worker memory
    //   // fallback to an iframe.
    //   if ((!cache || !cache.refresh_token) && !this.worker) {
    //     return await this._getTokenFromIFrame(options);
    //   }
    //   const redirect_uri =
    //     options.redirect_uri ||
    //     // this.options.redirect_uri ||
    //     window.location.origin;
    //   let tokenResult: TokenEndpointResponse;
    //   const {
    //     scope,
    //     audience,
    //     ignoreCache,
    //     timeoutInSeconds,
    //     detailedResponse,
    //     ...customOptions
    //   } = options;
    //   const timeout =
    //     typeof options.timeoutInSeconds === 'number'
    //       ? options.timeoutInSeconds * 1000
    //       : null;
    //   try {
    //     tokenResult = await oauthToken(
    //       {
    //         ...this.customOptions,
    //         ...customOptions,
    //         audience,
    //         scope,
    //         baseUrl: this.domainUrl,
    //         client_id: this.options.clientID,
    //         grant_type: 'refresh_token',
    //         refresh_token: cache && cache.refresh_token,
    //         redirect_uri,
    //         ...(timeout && { timeout }),
    //         slashAuthClient: this.options.slashAuthClient,
    //         // useFormData: this.options.useFormData,
    //         timeout: this.httpTimeoutMs,
    //       } as RefreshTokenOptions,
    //       this.worker
    //     );
    //   } catch (e) {
    //     if (
    //       // The web worker didn't have a refresh token in memory so
    //       // fallback to an iframe.
    //       e.message === MISSING_REFRESH_TOKEN_ERROR_MESSAGE ||
    //       // A refresh token was found, but is it no longer valid.
    //       // Fallback to an iframe.
    //       (e.message &&
    //         e.message.indexOf(INVALID_REFRESH_TOKEN_ERROR_MESSAGE) > -1)
    //     ) {
    //       return await this._getTokenFromIFrame(options);
    //     }
    //     throw e;
    //   }
    //   const decodedToken = await this._verifyIdToken(tokenResult.id_token);
    //   return {
    //     ...tokenResult,
    //     decodedToken,
    //     scope: options.scope,
    //     oauthTokenScope: tokenResult.scope,
    //     audience: options.audience || 'default',
    //   };
    // }
    SlashAuthClient.prototype._getEntryFromCache = function (_a) {
        var scope = _a.scope, audience = _a.audience, client_id = _a.client_id, _b = _a.getDetailedEntry, getDetailedEntry = _b === void 0 ? false : _b;
        return __awaiter(this, void 0, void 0, function () {
            var entry, id_token, access_token, oauthTokenScope, expires_in;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.cacheManager.get(new cache_1.CacheKey({
                            scope: scope,
                            audience: audience,
                            client_id: client_id,
                        }), 60 // get a new token if within 60 seconds of expiring
                        )];
                    case 1:
                        entry = _c.sent();
                        if (entry && entry.access_token) {
                            if (getDetailedEntry) {
                                id_token = entry.id_token, access_token = entry.access_token, oauthTokenScope = entry.oauthTokenScope, expires_in = entry.expires_in;
                                return [2 /*return*/, __assign(__assign({ id_token: id_token, access_token: access_token }, (oauthTokenScope ? { scope: oauthTokenScope } : null)), { expires_in: expires_in })];
                            }
                            return [2 /*return*/, entry.access_token];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return SlashAuthClient;
}());
exports.default = SlashAuthClient;
//# sourceMappingURL=client.js.map