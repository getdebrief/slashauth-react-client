import Lock from 'browser-tabs-lock';

import {
  createQueryParams,
  encode,
  createRandomString,
  sha256,
  bufferToBase64UrlEncoded,
  validateCrypto,
  singlePromise,
  retryPromise,
} from './utils';

import { getUniqueScopes } from './scope';

import {
  InMemoryCache,
  ICache,
  LocalStorageCache,
  CacheKey,
  CacheManager,
} from './cache';

import TransactionManager from './transaction-manager';
import { verify as verifyIdToken } from './jwt';
import { TimeoutError } from './errors';

import {
  ClientStorage,
  CookieStorageWithLegacySameSite,
  SessionStorage,
} from './storage';

import {
  CACHE_LOCATION_MEMORY,
  DEFAULT_SESSION_CHECK_EXPIRY_DAYS,
  DEFAULT_SLASHAUTH_CLIENT,
  DEFAULT_NOW_PROVIDER,
  DEFAULT_FETCH_TIMEOUT_MS,
  RECOVERABLE_ERRORS,
} from './constants';

import {
  SlashAuthClientOptions,
  BaseLoginOptions,
  AuthorizeOptions,
  CacheLocation,
  IdToken,
  Account,
  GetAccountOptions,
  GetIdTokenClaimsOptions,
  GetTokenSilentlyOptions,
  GetTokenSilentlyVerboseResponse,
  LogoutOptions,
  LogoutUrlOptions,
  LoginNoRedirectNoPopupOptions,
  GetNonceToSignOptions,
} from './global';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line import/default
// import TokenWorker from './worker/token.worker.ts';
import { CacheKeyManifest } from './cache/key-manifest';
import browserDeviceID from './device';
import { getNonceToSign, loginWithSignedNonce } from './api';

// type GetTokenSilentlyResult = TokenEndpointResponse & {
//   decodedToken: ReturnType<typeof verifyIdToken>;
//   scope: string;
//   oauthTokenScope?: string;
//   audience: string;
// };

/**
 * @ignore
 */
const lock = new Lock();

/**
 * @ignore
 */
const GET_TOKEN_SILENTLY_LOCK_KEY = 'auth0.lock.getTokenSilently';

/**
 * @ignore
 */
const buildOrganizationHintCookieName = (clientId: string) =>
  `auth0.${clientId}.organization_hint`;

/**
 * @ignore
 */
const OLD_IS_AUTHENTICATED_COOKIE_NAME = 'auth0.is.authenticated';

/**
 * @ignore
 */
const buildIsAuthenticatedCookieName = (clientId: string) =>
  `auth0.${clientId}.is.authenticated`;

/**
 * @ignore
 */
const cacheLocationBuilders: Record<string, () => ICache> = {
  memory: () => new InMemoryCache().enclosedCache,
  localstorage: () => new LocalStorageCache(),
};

/**
 * @ignore
 */
const cacheFactory = (location: string) => {
  return cacheLocationBuilders[location];
};

/**
 * @ignore
 */
const getTokenIssuer = (issuer: string, domainUrl: string) => {
  if (issuer) {
    return issuer.startsWith('https://') ? issuer : `https://${issuer}/`;
  }

  return `${domainUrl}/`;
};

/**
 * @ignore
 */
const getDomain = (domainUrl: string) => {
  if (!/^https?:\/\//.test(domainUrl)) {
    return `https://${domainUrl}`;
  }

  return domainUrl;
};

/**
 * @ignore
 */
const getCustomInitialOptions = (
  options: SlashAuthClientOptions
): BaseLoginOptions => {
  const {
    slashAuthClient,
    cacheLocation,
    clientID,
    domain,
    issuer,
    leeway,
    max_age,
    ...customParams
  } = options;
  return customParams;
};

/**
 * SlashAuth SDK for Single Page Applications using no-redirect, no popup flow.
 */
export default class SlashAuthClient {
  private readonly transactionManager: TransactionManager;
  private readonly cacheManager: CacheManager;
  private readonly customOptions: BaseLoginOptions;
  private readonly domainUrl: string;
  private readonly tokenIssuer: string;
  private readonly defaultScope: string;
  private readonly scope: string;
  private readonly cookieStorage: ClientStorage;
  private readonly sessionCheckExpiryDays: number;
  private readonly orgHintCookieName: string;
  private readonly isAuthenticatedCookieName: string;
  private readonly nowProvider: () => number | Promise<number>;
  private readonly httpTimeoutMs: number;

  cacheLocation: CacheLocation;
  private worker: Worker;

  constructor(private options: SlashAuthClientOptions) {
    typeof window !== 'undefined' && validateCrypto();

    if (options.cache && options.cacheLocation) {
      console.warn(
        'Both `cache` and `cacheLocation` options have been specified in the Auth0Client configuration; ignoring `cacheLocation` and using `cache`.'
      );
    }

    let cache: ICache;

    if (options.cache) {
      cache = options.cache;
    } else {
      this.cacheLocation = options.cacheLocation || CACHE_LOCATION_MEMORY;

      if (!cacheFactory(this.cacheLocation)) {
        throw new Error(`Invalid cache location "${this.cacheLocation}"`);
      }

      cache = cacheFactory(this.cacheLocation)();
    }

    // this.httpTimeoutMs = options.httpTimeoutInSeconds
    //   ? options.httpTimeoutInSeconds * 1000
    //   : DEFAULT_FETCH_TIMEOUT_MS;
    this.httpTimeoutMs = DEFAULT_FETCH_TIMEOUT_MS;

    // this.cookieStorage =
    //   options.legacySameSiteCookie === false
    //     ? CookieStorage
    //     : CookieStorageWithLegacySameSite;
    this.cookieStorage = CookieStorageWithLegacySameSite;

    this.orgHintCookieName = buildOrganizationHintCookieName(
      this.options.clientID
    );

    this.isAuthenticatedCookieName = buildIsAuthenticatedCookieName(
      this.options.clientID
    );

    // this.sessionCheckExpiryDays =
    //   options.sessionCheckExpiryDays || DEFAULT_SESSION_CHECK_EXPIRY_DAYS;
    this.sessionCheckExpiryDays = DEFAULT_SESSION_CHECK_EXPIRY_DAYS;

    // const transactionStorage = options.useCookiesForTransactions
    //   ? this.cookieStorage
    //   : SessionStorage;
    const transactionStorage = SessionStorage;

    // this.scope = this.options.scope;
    this.scope = '';

    this.transactionManager = new TransactionManager(
      transactionStorage,
      this.options.clientID
    );

    // this.nowProvider = this.options.nowProvider || DEFAULT_NOW_PROVIDER;
    this.nowProvider = DEFAULT_NOW_PROVIDER;

    this.cacheManager = new CacheManager(
      cache,
      !cache.allKeys
        ? new CacheKeyManifest(cache, this.options.clientID)
        : null,
      this.nowProvider
    );

    this.domainUrl = getDomain(this.options.domain);
    this.tokenIssuer = getTokenIssuer(this.options.issuer, this.domainUrl);

    // this.defaultScope = getUniqueScopes(
    //   'openid',
    //   this.options?.advancedOptions?.defaultScope !== undefined
    //     ? this.options.advancedOptions.defaultScope
    //     : DEFAULT_SCOPE
    // );
    this.defaultScope = getUniqueScopes('openid');

    // If using refresh tokens, automatically specify the `offline_access` scope.
    // Note we cannot add this to 'defaultScope' above as the scopes are used in the
    // cache keys - changing the order could invalidate the keys
    // if (this.options.useRefreshTokens) {
    //   this.scope = getUniqueScopes(this.scope, 'offline_access');
    // }
    this.scope = getUniqueScopes(this.scope, 'offline_access');

    // Don't use web workers unless using refresh tokens in memory and not IE11
    // if (
    //   typeof window !== 'undefined' &&
    //   window.Worker &&
    //   // this.options.useRefreshTokens &&
    //   this.cacheLocation === CACHE_LOCATION_MEMORY &&
    //   supportWebWorker()
    // ) {
    //   this.worker = new TokenWorker();
    // }

    this.customOptions = getCustomInitialOptions(options);
  }

  private _url(path: string) {
    const slashAuthClient = encodeURIComponent(
      btoa(
        JSON.stringify(this.options.slashAuthClient || DEFAULT_SLASHAUTH_CLIENT)
      )
    );
    return `${this.domainUrl}${path}&slashauthClient=${slashAuthClient}`;
  }

  private _getParams(
    authorizeOptions: BaseLoginOptions,
    state: string,
    nonce: string,
    code_challenge: string,
    redirect_uri: string
  ): AuthorizeOptions {
    // These options should be excluded from the authorize URL,
    // as they're options for the client and not for the IdP.
    // ** IMPORTANT ** If adding a new client option, include it in this destructure list.
    const { slashAuthClient, cacheLocation, domain, leeway, ...loginOptions } =
      this.options;

    return {
      ...loginOptions,
      ...authorizeOptions,
      scope: getUniqueScopes(
        this.defaultScope,
        this.scope,
        // authorizeOptions.scope
        ''
      ),
      response_type: 'code',
      response_mode: 'query',
      state,
      nonce,
      // redirect_uri: redirect_uri || this.options.redirect_uri,
      redirect_uri: redirect_uri,
      code_challenge,
      code_challenge_method: 'S256',
    };
  }

  private _authorizeUrl(authorizeOptions: AuthorizeOptions) {
    return this._url(`/authorize?${createQueryParams(authorizeOptions)}`);
  }

  private async _verifyIdToken(
    id_token: string,
    nonce?: string,
    organizationId?: string
  ) {
    const now = await this.nowProvider();

    return verifyIdToken({
      iss: this.tokenIssuer,
      aud: 'default',
      id_token,
      nonce,
      organizationId,
      leeway: this.options.leeway,
      max_age: this._parseNumber(this.options.max_age),
      now,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _parseNumber(value: any): number {
    if (typeof value !== 'string') {
      return value;
    }
    return parseInt(value, 10) || undefined;
  }

  private _processOrgIdHint(organizationId?: string) {
    if (organizationId) {
      this.cookieStorage.save(this.orgHintCookieName, organizationId, {
        daysUntilExpire: this.sessionCheckExpiryDays,
      });
    } else {
      this.cookieStorage.remove(this.orgHintCookieName);
    }
  }

  /**
   * ```js
   * await slashauth.buildAuthorizeUrl(options);
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
   * const user = await slashauth.getAccount();
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
  public async getAccount<TAccount extends Account>(
    options: GetAccountOptions = {}
  ): Promise<TAccount | undefined> {
    // const audience = options.audience || this.options.audience || 'default';
    const audience = options.audience || 'default';
    const scope = getUniqueScopes(this.defaultScope, this.scope, options.scope);

    const cache = await this.cacheManager.get(
      new CacheKey({
        client_id: this.options.clientID,
        audience,
        scope,
      })
    );

    return cache && cache.decodedToken && (cache.decodedToken.user as TAccount);
  }

  /**
   * ```js
   * const claims = await slashauth.getIdTokenClaims();
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
  public async getIdTokenClaims(
    options: GetIdTokenClaimsOptions = {}
  ): Promise<IdToken | undefined> {
    // const audience = options.audience || this.options.audience || 'default';
    const audience = options.audience || 'default';
    const scope = getUniqueScopes(this.defaultScope, this.scope, options.scope);

    const cache = await this.cacheManager.get(
      new CacheKey({
        client_id: this.options.clientID,
        audience,
        scope,
      })
    );

    return cache && cache.decodedToken && cache.decodedToken.claims;
  }

  /**
   * ```js
   * await slashauth.loginWithRedirect(options);
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
  public async checkSession(options?: GetTokenSilentlyOptions) {
    if (!this.cookieStorage.get(this.isAuthenticatedCookieName)) {
      if (!this.cookieStorage.get(OLD_IS_AUTHENTICATED_COOKIE_NAME)) {
        return;
      } else {
        // Migrate the existing cookie to the new name scoped by client ID
        this.cookieStorage.save(this.isAuthenticatedCookieName, true, {
          daysUntilExpire: this.sessionCheckExpiryDays,
          cookieDomain: this.options.cookieDomain,
        });

        this.cookieStorage.remove(OLD_IS_AUTHENTICATED_COOKIE_NAME);
      }
    }

    try {
      await this.getTokenSilently(options);
    } catch (error) {
      if (!RECOVERABLE_ERRORS.includes(error.error)) {
        throw error;
      }
    }
  }

  /**
   * Fetches a new access token and returns the response from the /oauth/token endpoint, omitting the refresh token.
   *
   * @param options
   */
  public async getTokenSilently(
    options: GetTokenSilentlyOptions & { detailedResponse: true }
  ): Promise<GetTokenSilentlyVerboseResponse>;

  /**
   * Fetches a new access token and returns it.
   *
   * @param options
   */
  public async getTokenSilently(
    options?: GetTokenSilentlyOptions
  ): Promise<string>;

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
  public async getTokenSilently(
    options: GetTokenSilentlyOptions = {}
  ): Promise<string | GetTokenSilentlyVerboseResponse> {
    const { ignoreCache, ...getTokenOptions } = {
      audience: this.options.audience,
      ignoreCache: false,
      ...options,
      scope: getUniqueScopes(this.defaultScope, this.scope, options.scope),
    };

    return singlePromise(
      () =>
        this._getTokenSilently({
          ignoreCache,
          ...getTokenOptions,
        }),
      `${this.options.clientID}::${getTokenOptions.audience}::${getTokenOptions.scope}`
    );
  }

  private async _getTokenSilently(
    options: GetTokenSilentlyOptions = {}
  ): Promise<string | GetTokenSilentlyVerboseResponse> {
    const { ignoreCache, ...getTokenOptions } = options;

    // Check the cache before acquiring the lock to avoid the latency of
    // `lock.acquireLock` when the cache is populated.
    if (!ignoreCache) {
      const entry = await this._getEntryFromCache({
        scope: getTokenOptions.scope,
        audience: getTokenOptions.audience || 'default',
        client_id: this.options.clientID,
        getDetailedEntry: options.detailedResponse,
      });

      if (entry) {
        return entry;
      }
    }

    if (
      await retryPromise(
        () => lock.acquireLock(GET_TOKEN_SILENTLY_LOCK_KEY, 5000),
        10
      )
    ) {
      try {
        // Check the cache a second time, because it may have been populated
        // by a previous call while this call was waiting to acquire the lock.
        if (!ignoreCache) {
          const entry = await this._getEntryFromCache({
            scope: getTokenOptions.scope,
            audience: getTokenOptions.audience || 'default',
            client_id: this.options.clientID,
            getDetailedEntry: options.detailedResponse,
          });

          if (entry) {
            return entry;
          }
        }

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
      } finally {
        await lock.releaseLock(GET_TOKEN_SILENTLY_LOCK_KEY);
      }
    } else {
      throw new TimeoutError();
    }
  }

  public async getNonceToSign(options: GetNonceToSignOptions): Promise<string> {
    const queryParameters = {
      address: options.address,
      device_id: browserDeviceID,
      client_id: this.options.clientID,
    };

    const nonceResult = await getNonceToSign({
      baseUrl: getDomain(this.domainUrl),
      ...queryParameters,
    });

    return nonceResult.nonce;
  }

  /**
   *
   * @returns
   */
  public async loginNoRedirectNoPopup(options: LoginNoRedirectNoPopupOptions) {
    const { ...authorizeOptions } = options;
    const stateIn = encode(createRandomString());
    const nonceIn = encode(createRandomString());
    const code_verifier = createRandomString();
    const code_challengeBuffer = await sha256(code_verifier);
    const code_challenge = bufferToBase64UrlEncoded(code_challengeBuffer);

    const params = this._getParams(
      authorizeOptions,
      stateIn,
      nonceIn,
      code_challenge,
      this.options.redirect_uri || window.location.origin
    );

    // const url = this._authorizeUrl({
    //   ...params,
    //   response_mode: 'web_message',
    // });

    // TODO(ned): Make request to backend
    const queryParameters = {
      address: options.address,
      signature: options.signature,
      device_id: browserDeviceID,
      client_id: this.options.clientID,
    };

    //const authorizeTimeout = options.timeoutInSeconds;
    // const authResult = await runIframe(
    //   requestURL,
    //   this.domainUrl,
    //   authorizeTimeout
    // );

    const authResult = await loginWithSignedNonce({
      baseUrl: getDomain(this.domainUrl),
      ...queryParameters,
    });

    // if (stateIn !== iframeResult.state) {
    //   throw new Error('Invalid state');
    // }

    // if (stateIn !== codeResult.state) {
    //   throw new Error('Invalid state');
    // }

    // const authResult = await oauthToken(
    //   {
    //     audience: params.audience,
    //     scope: params.scope,
    //     baseUrl: this.domainUrl,
    //     client_id: this.options.client_id,
    //     code_verifier,
    //     code: codeResult.code,
    //     grant_type: 'authorization_code',
    //     redirect_uri: params.redirect_uri,
    //     auth0Client: this.options.auth0Client,
    //     useFormData: this.options.useFormData,
    //     timeout: this.httpTimeoutMs,
    //   } as OAuthTokenOptions,
    //   this.worker
    // );

    // const organizationId = options.organization || this.options.organization;

    const decodedToken = await this._verifyIdToken(authResult.access_token);

    const cacheEntry = {
      ...authResult,
      decodedToken,
      scope: params.scope,
      audience: params.audience || 'default',
      client_id: this.options.client_id,
    };

    await this.cacheManager.set(cacheEntry);

    this.cookieStorage.save(this.isAuthenticatedCookieName, true, {
      daysUntilExpire: this.sessionCheckExpiryDays,
      cookieDomain: this.options.cookieDomain,
    });

    this._processOrgIdHint(decodedToken.claims.org_id);
  }

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
  public async isAuthenticated() {
    const user = await this.getAccount();
    return !!user;
  }

  /**
   * ```js
   * await auth0.buildLogoutUrl(options);
   * ```
   *
   * Builds a URL to the logout endpoint using the parameters provided as arguments.
   * @param options
   */
  public buildLogoutUrl(options: LogoutUrlOptions = {}): string {
    if (options.client_id !== null) {
      options.client_id = options.client_id || this.options.clientID;
    } else {
      delete options.client_id;
    }

    const { ...logoutOptions } = options;
    const url = this._url(`/logout?${createQueryParams(logoutOptions)}`);

    return url;
  }

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
  public logout(options: LogoutOptions = {}): Promise<void> | void {
    const { localOnly, ...logoutOptions } = options;

    // if (localOnly && logoutOptions.federated) {
    //   throw new Error(
    //     'It is invalid to set both the `federated` and `localOnly` options to `true`'
    //   );
    // }

    const postCacheClear = () => {
      this.cookieStorage.remove(this.orgHintCookieName);
      this.cookieStorage.remove(this.isAuthenticatedCookieName);

      if (localOnly) {
        return;
      }

      const url = this.buildLogoutUrl(logoutOptions);

      window.location.assign(url);
    };

    if (this.options.cache) {
      return this.cacheManager.clear().then(() => postCacheClear());
    } else {
      this.cacheManager.clearSync();
      postCacheClear();
    }
  }

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

  private async _getEntryFromCache({
    scope,
    audience,
    client_id,
    getDetailedEntry = false,
  }: {
    scope: string;
    audience: string;
    client_id: string;
    getDetailedEntry?: boolean;
  }) {
    const entry = await this.cacheManager.get(
      new CacheKey({
        scope,
        audience,
        client_id,
      }),
      60 // get a new token if within 60 seconds of expiring
    );

    if (entry && entry.access_token) {
      if (getDetailedEntry) {
        const { id_token, access_token, oauthTokenScope, expires_in } = entry;

        return {
          id_token,
          access_token,
          ...(oauthTokenScope ? { scope: oauthTokenScope } : null),
          expires_in,
        };
      }

      return entry.access_token;
    }
  }
}
