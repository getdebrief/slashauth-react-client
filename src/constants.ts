export const DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS = 60;
export const DEFAULT_SILENT_TOKEN_RETRY_COUNT = 3;
export const CLEANUP_IFRAME_TIMEOUT_IN_SECONDS = 2;
export const DEFAULT_FETCH_TIMEOUT_MS = 10000;
export const CACHE_LOCATION_MEMORY = 'memory';
export const CACHE_LOCATION_LOCAL_STORAGE = 'localstorage';

export const MISSING_REFRESH_TOKEN_ERROR_MESSAGE =
  'The web worker is missing the refresh token';

export const INVALID_REFRESH_TOKEN_ERROR_MESSAGE = 'invalid refresh token';

/**
 * @ignore
 */
export const DEFAULT_SESSION_CHECK_EXPIRY_DAYS = 1;

export const DEFAULT_NOW_PROVIDER = () => Date.now();

export const DEFAULT_SLASHAUTH_CLIENT = {
  name: 'slashauth-react',
  version: '',
};

export const RECOVERABLE_ERRORS = [
  'login_required',
  'consent_required',
  'interaction_required',
  'account_selection_required',
  // Strictly speaking the user can't recover from `access_denied` - but they
  // can get more information about their access being denied by logging in
  // interactively.
  'access_denied',
];
