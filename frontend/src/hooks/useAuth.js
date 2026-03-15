import { useState, useCallback } from 'react';
import { setToken, removeToken, isAuthenticated as checkAuth, getCurrentUser } from '../services/auth';
import { login as apiLogin } from '../services/api';

/**
 * useAuth — authentication state hook
 */
export default function useAuth() {
  const [authenticated, setAuthenticated] = useState(checkAuth());
  const [user, setUser]                   = useState(getCurrentUser());
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);

  const login = useCallback(async (email, senha) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiLogin(email, senha);
      const token = data.access_token || data.token;
      setToken(token);
      setAuthenticated(true);
      setUser(getCurrentUser());
      return true;
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Credenciais inválidas';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setAuthenticated(false);
    setUser(null);
  }, []);

  return { user, isAuthenticated: authenticated, login, logout, loading, error };
}
