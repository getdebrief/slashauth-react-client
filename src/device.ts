import { v4 as uuidv4 } from 'uuid';
import { LocalStorageCache } from './cache';

const cache = new LocalStorageCache();

const DEVICE_ID = '_slashauth-browser-id';

let browserDeviceID = uuidv4();
let success = false;

try {
  const existing = cache.get<string>(DEVICE_ID);
  if (existing) {
    browserDeviceID = existing;
    success = true;
  }
  // eslint-disable-next-line no-empty
} catch {}

if (!success) {
  const browserDeviceID = uuidv4();
  cache.set<string>(DEVICE_ID, browserDeviceID);
}

export default browserDeviceID;
