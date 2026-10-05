import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vaultpay_token') || null;
    }
    return null;
  });

  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('vaultpay_user');
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('vaultpay_token');
    localStorage.removeItem('vaultpay_user');
    setToken(null);
    setUser(null);
  }, []);

  // Validate active session against server
  const verifySession = useCallback(async () => {
    const savedToken = localStorage.getItem('vaultpay_token');
    if (!savedToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.auth.me();
      if (res && res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('vaultpay_user', JSON.stringify(res.data));
      } else {
        logout();
      }
    } catch (err) {
      console.warn('[AuthContext] Session expired or invalid:', err.message);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  const login = async (email, password) => {
    const res = await api.auth.login(email, password);
    if (res && res.success && res.data) {
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('vaultpay_token', newToken);
      localStorage.setItem('vaultpay_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      return newUser;
    }
    throw new Error(res?.message || 'Login failed');
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === 'ADMIN',
    isClient: user?.role === 'CLIENT',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
