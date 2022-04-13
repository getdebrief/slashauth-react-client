import { Account } from './global';

export type SlashAuthState = {
  error?: Error;
  isAuthenticated: boolean;
  isLoading: boolean;
  account?: Account;
};

export const initialAuthState: SlashAuthState = {
  isAuthenticated: false,
  isLoading: true,
};
