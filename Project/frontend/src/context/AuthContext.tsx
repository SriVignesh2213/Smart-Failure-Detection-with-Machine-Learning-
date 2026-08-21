import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  email: string;
  full_name: string;
  role: string;
  id: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safely load credentials from localStorage
    try {
      const savedToken = localStorage.getItem('token');
      if (savedToken && savedToken !== 'undefined' && savedToken !== 'null') {
        const parts = savedToken.split('.');
        if (parts.length === 3) {
          // Base64 decode JWT payload safely
          const base64Url = parts[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);

          setUser({
            email: payload.sub || '',
            full_name: payload.full_name || 'System Engineer',
            role: payload.role || 'engineer',
            id: payload.user_id || ''
          });
          setToken(savedToken);
        } else {
          localStorage.removeItem('token');
        }
      } else {
        localStorage.removeItem('token');
      }
    } catch (e) {
      console.error('Failed to parse saved auth token', e);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (newToken: string) => {
    try {
      localStorage.setItem('token', newToken);
      const parts = newToken.split('.');
      if (parts.length === 3) {
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);

        setUser({
          email: payload.sub || '',
          full_name: payload.full_name || 'System Engineer',
          role: payload.role || 'engineer',
          id: payload.user_id || ''
        });
        setToken(newToken);
      }
    } catch (e) {
      console.error('Failed to process login token', e);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
