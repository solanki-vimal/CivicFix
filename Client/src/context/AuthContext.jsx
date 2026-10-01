/*
 * On mount, calls GET /me once to check whether the httpOnly cookie from a
 * previous session is still valid — this is how a page refresh doesn't log
 * the user out. `loading` stays true until that check resolves, so
 * ProtectedRoute knows not to redirect prematurely while it's in flight.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authApi from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .getMe()
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signup = useCallback(async (credentials) => {
    const res = await authApi.signup(credentials);
    setUser(res.data);
    return res;
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await authApi.login(credentials);
    setUser(res.data);
    return res;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const value = { user, loading, isAuthenticated: !!user, signup, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
