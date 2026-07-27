import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AUTH_SERVICE } from '@/api/auth';
import type { IAuthContext } from '@/types/auth-context-types';
import type { IUser } from '@/types/api/auth-types';

const AuthContext = createContext<IAuthContext | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = AUTH_SERVICE.getStoredUser();
    const storedToken = AUTH_SERVICE.getStoredToken();

    if (storedUser && storedToken) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await AUTH_SERVICE.login({ username, password });
    setUser(response.user);
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string, password2: string) => {
      const response = await AUTH_SERVICE.register({
        username,
        email,
        password,
        password2,
      });
      setUser(response.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    await AUTH_SERVICE.logout();
    setUser(null);
  }, []);

  const value: IAuthContext = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
