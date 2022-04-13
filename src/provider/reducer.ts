import { Account } from '../global';
import { SlashAuthState } from '../auth-state';

type Action =
  | { type: 'LOGIN_POPUP_STARTED' }
  | {
      type:
        | 'INITIALISED'
        | 'LOGIN_POPUP_COMPLETE'
        | 'GET_ACCESS_TOKEN_COMPLETE'
        | 'HANDLE_REDIRECT_COMPLETE';
      account?: Account;
    }
  | { type: 'LOGOUT' }
  | { type: 'ERROR'; error: Error };

/**
 * Handles how that state changes in the `useAuth0` hook.
 */
export const reducer = (
  state: SlashAuthState,
  action: Action
): SlashAuthState => {
  switch (action.type) {
    case 'LOGIN_POPUP_STARTED':
      return {
        ...state,
        isLoading: true,
      };
    case 'LOGIN_POPUP_COMPLETE':
    case 'INITIALISED':
      return {
        ...state,
        isAuthenticated: !!action.account,
        account: action.account,
        isLoading: false,
        error: undefined,
      };
    case 'HANDLE_REDIRECT_COMPLETE':
    case 'GET_ACCESS_TOKEN_COMPLETE':
      if (state.account?.updatedAt === action.account?.updatedAt) {
        return state;
      }
      return {
        ...state,
        isAuthenticated: !!action.account,
        account: action.account,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        account: undefined,
      };
    case 'ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.error,
      };
  }
};
