import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('resumeiq-token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('resumeiq-token');
          setToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (payload) => {
    const response = await api.post('/auth/login', payload);
    const nextToken = response.data.token;
    localStorage.setItem('resumeiq-token', nextToken);
    setToken(nextToken);
    setUser(response.data.user);
    return response.data;
  };

  const register = async (payload) => {
    const response = await api.post('/auth/register', payload);
    const nextToken = response.data.token;
    localStorage.setItem('resumeiq-token', nextToken);
    setToken(nextToken);
    setUser(response.data.user);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('resumeiq-token');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
