import createSlashAuthClient, {
  SlashAuthClient,
  GenericError,
  AuthenticationError,
  TimeoutError,
  PopupTimeoutError,
  MfaRequiredError,
} from './index';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const wrapper = createSlashAuthClient as any;

wrapper.Auth0Client = SlashAuthClient;
wrapper.createAuth0Client = createSlashAuthClient;
wrapper.GenericError = GenericError;
wrapper.AuthenticationError = AuthenticationError;
wrapper.TimeoutError = TimeoutError;
wrapper.PopupTimeoutError = PopupTimeoutError;
wrapper.MfaRequiredError = MfaRequiredError;

export default wrapper;
