import { ICache } from './cache';

export enum Network {
  Unknown,
  Ethereum,
}

export class Account {
  network: Network;
  address: string;
  updatedAt?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BaseLoginOptions {
  cacheLocation?: CacheLocation;

  issuer?: string;

  leeway?: number;

  max_age?: number;

  cache?: ICache;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface GetNonceToSignOptions extends BaseLoginOptions {
  address: string;
}

export interface SlashAuthClientOptions extends BaseLoginOptions {
  /*
    The domain for logging in. Will likely be companyname.slashauth.xyz
  */
  domain: string;

  /*
   * The domain the cookie is accessible from. If not set, the cookie is scoped to
   * the current domain, including the subdomain.
   *
   * Note: setting this incorrectly may cause silent authentication to stop working
   * on page load.
   *
   *
   * To keep a user logged in across multiple subdomains set this to your
   * top-level domain and prefixed with a `.` (eg: `.example.com`).
   */
  cookieDomain?: string;

  /*
    Your client ID
  */
  clientID: string;

  /*
   * The default audience to be used for requesting API access.
   */
  audience?: string;

  /**
   * Internal property to send information about the client to the authorization server.
   * @internal
   */
  slashAuthClient?: { name: string; version: string };
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GetTokenNoPopupNoRedirectOptions extends BaseLoginOptions {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface LoginNoRedirectNoPopupOptions extends BaseLoginOptions {
  address: string;

  signature: string;
}

export interface IdToken {
  __raw: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  middle_name?: string;
  nickname?: string;
  preferred_username?: string;
  profile?: string;
  picture?: string;
  website?: string;
  email?: string;
  email_verified?: boolean;
  gender?: string;
  birthdate?: string;
  zoneinfo?: string;
  locale?: string;
  phone_number?: string;
  phone_number_verified?: boolean;
  address?: string;
  updated_at?: string;
  iss?: string;
  aud?: string;
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  azp?: string;
  nonce?: string;
  auth_time?: string;
  at_hash?: string;
  c_hash?: string;
  acr?: string;
  amr?: string;
  sub_jwk?: string;
  cnf?: string;
  sid?: string;
  org_id?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface JWTVerifyOptions {
  iss: string;
  aud: string;
  id_token: string;
  nonce?: string;
  leeway?: number;
  max_age?: number;
  organizationId?: string;
  now?: number;
}

export interface GetNonceToSignEndpointOptions {
  baseUrl: string;
  address: string;
  client_id: string;
  device_id: string;
}

export interface LoginWithSignedNonceOptions
  extends GetNonceToSignEndpointOptions {
  signature: string;
}

export interface GetNonceToSignResponse {
  nonce: string;
}

export interface LoginWithSignedNonceResponse {
  access_token: string;
  refresh_token: string;
  client_id: string;
  scopes: string[];
  expires_in: number;
}

export interface TokenEndpointOptions {
  baseUrl: string;
  clientID: string;
  grant_type: string;
  timeout?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  slashAuthClient: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface RefreshTokenOptions extends TokenEndpointOptions {
  refresh_token: string;
}

export type TokenEndpointResponse = {
  id_token?: string;
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  client_id?: string;
};

export type FetchOptions = {
  method?: string;
  headers?: Record<string, string>;
  credentials?: 'include' | 'omit';
  body?: string;
  signal?: AbortSignal;
};

export interface AuthorizeOptions extends BaseLoginOptions {
  response_type: string;
  response_mode: string;
  redirect_uri: string;
  nonce: string;
  state: string;
  scope: string;
  code_challenge: string;
  code_challenge_method: string;
}

export interface GetAccountOptions {
  /**
   * The scope that was used in the authentication request
   */
  scope?: string;
  /**
   * The audience that was used in the authentication request
   */
  audience?: string;
}

export interface GetIdTokenClaimsOptions {
  /**
   * The scope that was used in the authentication request
   */
  scope?: string;
  /**
   * The audience that was used in the authentication request
   */
  audience?: string;
}

export interface GetTokenSilentlyOptions {
  /**
   * When `true`, ignores the cache and always sends a
   * request to Auth0.
   */
  ignoreCache?: boolean;

  /** A maximum number of seconds to wait before declaring the background /authorize call as failed for timeout
   * Defaults to 60s.
   */
  timeoutInSeconds?: number;

  /**
   * If true, the full response from the /oauth/token endpoint (or the cache, if the cache was used) is returned
   * (minus `refresh_token` if one was issued). Otherwise, just the access token is returned.
   *
   * The default is `false`.
   */
  detailedResponse?: boolean;

  /**
   * If you need to send custom parameters to the Authorization Server,
   * make sure to use the original parameter name.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface LogoutOptions {
  /**
   * The URL where SlashAuth will redirect your browser to after the logout.
   *
   * **Note**: If the `client_id` parameter is included, the
   * `returnTo` URL that is provided must be listed in the
   * Application's "Allowed Logout URLs" in the SlashAuth dashboard.
   * However, if the `client_id` parameter is not included, the
   * `returnTo` URL must be listed in the "Allowed Logout URLs" at
   * the account level in the SlashAuth dashboard.
   */
  returnTo?: string;

  /**
   * The `client_id` of your application.
   *
   * If this property is not set, then the `client_id` that was used during initialization of the SDK is sent to the logout endpoint.
   *
   * If this property is set to `null`, then no client ID value is sent to the logout endpoint.
   */
  client_id?: string;

  /**
   * When `true`, this skips the request to the logout endpoint on the authorization server,
   * effectively performing a "local" logout of the application. No redirect should take place,
   * you should update local logged in state.
   */
  localOnly?: boolean;
}

export interface LogoutUrlOptions {
  /**
   * The URL where SlashAuth will redirect your browser to after the logout.
   *
   * **Note**: If the `client_id` parameter is included, the
   * `returnTo` URL that is provided must be listed in the
   * Application's "Allowed Logout URLs" in the SlashAuth dashboard.
   * However, if the `client_id` parameter is not included, the
   * `returnTo` URL must be listed in the "Allowed Logout URLs" at
   * the account level in the SlashAuth dashboard.
   */
  returnTo?: string;

  /**
   * The `client_id` of your application.
   *
   * If this property is not set, then the `client_id` that was used during initialization of the SDK is sent to the logout endpoint.
   *
   * If this property is set to `null`, then no client ID value is sent to the logout endpoint.
   *
   */
  client_id?: string;
}

export type CacheLocation = 'memory' | 'localstorage';

export interface AuthenticationResult {
  state: string;
  code?: string;
  error?: string;
  error_description?: string;
}

export interface OAuthTokenOptions extends TokenEndpointOptions {
  code_verifier: string;
  code: string;
  redirect_uri: string;
  audience: string;
  scope: string;
}

export type GetTokenSilentlyVerboseResponse = Omit<
  TokenEndpointResponse,
  'refresh_token'
>;
