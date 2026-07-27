import type { IUser } from '@/types/api/auth-types';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

const getStoredToken = (): string | null => localStorage.getItem(AUTH_TOKEN_KEY);

const getStoredUser = (): IUser | null => {
  const storedUser = localStorage.getItem(AUTH_USER_KEY);

  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as IUser;
  } catch {
    return null;
  }
};

const storeAuth = (token: string, user: IUser): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

const clearStoredAuth = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

export { clearStoredAuth, getStoredToken, getStoredUser, storeAuth };
