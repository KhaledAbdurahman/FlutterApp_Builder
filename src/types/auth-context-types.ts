import type { IUser } from '@/types/api/auth-types';

interface IAuthContext {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, password2: string) => Promise<void>;
  logout: () => Promise<void>;
}

export type { IAuthContext };
