import 'core-js/es/string/starts-with';
import 'core-js/es/symbol';
import 'core-js/es/array/from';
import 'core-js/es/typed-array/slice';
import 'core-js/es/array/includes';
import 'core-js/es/string/includes';
import 'core-js/es/set';
import 'promise-polyfill/src/polyfill';
import 'fast-text-encoding';
import 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only';

import SlashAuthClient from './client';
import { SlashAuthClientOptions } from './global';

export * from './global';

/**
 * Asynchronously creates the Auth0Client instance and calls `checkSession`.
 *
 * **Note:** There are caveats to using this in a private browser tab, which may not silently authenticae
 * a user on page refresh. Please see [the checkSession docs](https://auth0.github.io/auth0-spa-js/classes/auth0client.html#checksession) for more info.
 *
 * @param options The client options
 * @returns An instance of Auth0Client
 */
export default async function createSlashAuthClient(
  options: SlashAuthClientOptions
) {
  const slashAuth = new SlashAuthClient(options);
  await slashAuth.checkSession();
  return slashAuth;
}

export { SlashAuthClient };

export {
  GenericError,
  AuthenticationError,
  TimeoutError,
  PopupTimeoutError,
  PopupCancelledError,
  MfaRequiredError,
} from './errors';

export type { ICache, Cacheable } from './cache';
export { LocalStorageCache, InMemoryCache } from './cache';
