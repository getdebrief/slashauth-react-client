import {
  CLEANUP_IFRAME_TIMEOUT_IN_SECONDS,
  DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS,
} from '../constants';
import { GenericError, TimeoutError } from '../errors';
import { TokenEndpointResponse } from '../global';

export { singlePromise, retryPromise } from './promise';
export { hasAuthParams, loginError, tokenError } from './auth';

export const runIframe = (
  authorizeUrl: string,
  eventOrigin: string,
  timeoutInSeconds: number = DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS
) => {
  return new Promise<TokenEndpointResponse>((res, rej) => {
    const iframe = window.document.createElement('iframe');

    iframe.setAttribute('width', '0');
    iframe.setAttribute('height', '0');
    iframe.style.display = 'none';

    const removeIframe = () => {
      if (window.document.body.contains(iframe)) {
        window.document.body.removeChild(iframe);
        window.removeEventListener('message', iframeEventHandler, false);
      }
    };

    // eslint-disable-next-line prefer-const
    let iframeEventHandler: (e: MessageEvent) => void;

    const timeoutSetTimeoutId = setTimeout(() => {
      rej(new TimeoutError());
      removeIframe();
    }, timeoutInSeconds * 1000);

    iframeEventHandler = function (e: MessageEvent) {
      if (e.origin !== eventOrigin) return;
      if (!e.data || e.data.type !== 'authorization_response') return;

      const eventSource = e.source;

      if (eventSource) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (eventSource as any).close();
      }

      e.data.response.error
        ? rej(GenericError.fromPayload(e.data.response))
        : res(e.data.response);

      clearTimeout(timeoutSetTimeoutId);
      window.removeEventListener('message', iframeEventHandler, false);

      // Delay the removal of the iframe to prevent hanging loading status
      // in Chrome
      setTimeout(removeIframe, CLEANUP_IFRAME_TIMEOUT_IN_SECONDS * 1000);
    };

    window.addEventListener('message', iframeEventHandler, false);
    window.document.body.appendChild(iframe);
    iframe.setAttribute('src', authorizeUrl);
  });
};

// export const openPopup = (url: string) => {
//   const width = 400;
//   const height = 600;
//   const left = window.screenX + (window.innerWidth - width) / 2;
//   const top = window.screenY + (window.innerHeight - height) / 2;

//   return window.open(
//     url,
//     'auth0:authorize:popup',
//     `left=${left},top=${top},width=${width},height=${height},resizable,scrollbars=yes,status=1`
//   );
// };

// export const runPopup = (config: PopupConfigOptions) => {
//   return new Promise<AuthenticationResult>((resolve, reject) => {
//     // eslint-disable-next-line prefer-const
//     let popupEventListener: EventListenerOrEventListenerObject;

//     // Check each second if the popup is closed triggering a PopupCancelledError
//     const popupTimer = setInterval(() => {
//       if (config.popup && config.popup.closed) {
//         clearInterval(popupTimer);
//         clearTimeout(timeoutId);
//         window.removeEventListener('message', popupEventListener, false);
//         reject(new PopupCancelledError(config.popup));
//       }
//     }, 1000);

//     const timeoutId = setTimeout(() => {
//       clearInterval(popupTimer);
//       reject(new PopupTimeoutError(config.popup));
//       window.removeEventListener('message', popupEventListener, false);
//     }, (config.timeoutInSeconds || DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS) * 1000);

//     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//     // @ts-ignore
//     popupEventListener = function (e: MessageEvent) {
//       if (!e.data || e.data.type !== 'authorization_response') {
//         return;
//       }

//       clearTimeout(timeoutId);
//       clearInterval(popupTimer);
//       window.removeEventListener('message', popupEventListener, false);
//       config.popup.close();

//       if (e.data.response.error) {
//         return reject(GenericError.fromPayload(e.data.response));
//       }

//       resolve(e.data.response);
//     };

//     window.addEventListener('message', popupEventListener);
//   });
// };

export const getCrypto = () => {
  //ie 11.x uses msCrypto
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window.crypto || (window as any).msCrypto) as Crypto;
};

export const getCryptoSubtle = () => {
  const crypto = getCrypto();
  //safari 10.x uses webkitSubtle
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return crypto.subtle || (crypto as any).webkitSubtle;
};
export const createRandomString = () => {
  const charset =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_~.';
  let random = '';
  const randomValues = Array.from(
    getCrypto().getRandomValues(new Uint8Array(43))
  );
  randomValues.forEach((v) => (random += charset[v % charset.length]));
  return random;
};

export const encode = (value: string) => btoa(value);
export const decode = (value: string) => atob(value);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createQueryParams = (params: any) => {
  return Object.keys(params)
    .filter((k) => typeof params[k] !== 'undefined')
    .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
    .join('&');
};

export const sha256 = async (s: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const digestOp: any = getCryptoSubtle().digest(
    { name: 'SHA-256' },
    new TextEncoder().encode(s)
  );

  // msCrypto (IE11) uses the old spec, which is not Promise based
  // https://msdn.microsoft.com/en-us/expression/dn904640(v=vs.71)
  // Instead of returning a promise, it returns a CryptoOperation
  // with a result property in it.
  // As a result, the various events need to be handled in the event that we're
  // working in IE11 (hence the msCrypto check). These events just call resolve
  // or reject depending on their intention.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).msCrypto) {
    return new Promise((res, rej) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      digestOp.oncomplete = (e: any) => {
        res(e.target.result);
      };

      digestOp.onerror = (e: ErrorEvent) => {
        rej(e.error);
      };

      digestOp.onabort = () => {
        rej('The digest operation was aborted');
      };
    });
  }

  return await digestOp;
};

const urlEncodeB64 = (input: string) => {
  const b64Chars: { [index: string]: string } = { '+': '-', '/': '_', '=': '' };
  return input.replace(/[+/=]/g, (m: string) => b64Chars[m]);
};

// https://stackoverflow.com/questions/30106476/
const decodeB64 = (input: string) =>
  decodeURIComponent(
    atob(input)
      .split('')
      .map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );

export const urlDecodeB64 = (input: string) =>
  decodeB64(input.replace(/_/g, '/').replace(/-/g, '+'));

export const bufferToBase64UrlEncoded = (input: number[] | Uint8Array) => {
  const ie11SafeInput = new Uint8Array(input);
  return urlEncodeB64(
    window.btoa(String.fromCharCode(...Array.from(ie11SafeInput)))
  );
};

export const validateCrypto = () => {
  if (!getCrypto()) {
    throw new Error(
      'For security reasons, `window.crypto` is required to run `slashauth`.'
    );
  }
  if (typeof getCryptoSubtle() === 'undefined') {
    throw new Error(`
      slashauth must run on a secure origin.
    `);
  }
};
