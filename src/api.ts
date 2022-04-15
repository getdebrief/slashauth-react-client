import { DEFAULT_SLASHAUTH_CLIENT } from './constants';
import {
  GetNonceToSignEndpointOptions,
  GetNonceToSignResponse,
  LoginWithSignedNonceOptions,
  LoginWithSignedNonceResponse,
} from './global';
import { getJSON } from './http';
import { createQueryParams } from './utils';

export async function getNonceToSign({
  baseUrl,
  ...options
}: GetNonceToSignEndpointOptions) {
  const queryString = createQueryParams(options);
  return await getJSON<GetNonceToSignResponse>(
    `${baseUrl}/getNonceToSign?${queryString}`,
    1000,
    'default',
    '',
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-SlashAuth-Client': btoa(JSON.stringify(DEFAULT_SLASHAUTH_CLIENT)),
      },
    }
  );
}

export async function loginWithSignedNonce({
  baseUrl,
  ...options
}: LoginWithSignedNonceOptions) {
  const queryString = createQueryParams(options);
  return await getJSON<LoginWithSignedNonceResponse>(
    `${baseUrl}/loginWithSignedNonce?${queryString}`,
    1000,
    'default',
    '',
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-SlashAuth-Client': btoa(JSON.stringify(DEFAULT_SLASHAUTH_CLIENT)),
      },
    }
  );
}
