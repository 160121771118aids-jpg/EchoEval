import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      api.getMe()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('access_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('access_token', data.access_token);
    setUser(data.user);
    return data.user;
  };

  const signup = async (email, password, first_name) => {
    const data = await api.signup({ email, password, first_name });
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      setUser(data.user);
    }
    return data.user;
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw new Error(error.message);
  };

  const handleOAuthCallback = async (accessToken) => {
    const data = await api.googleAuth(accessToken);
    localStorage.setItem('access_token', data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const refreshUser = async () => {
    const data = await api.getMe();
    setUser(data);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, loginWithGoogle, handleOAuthCallback, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
