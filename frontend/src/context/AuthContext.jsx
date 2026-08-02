import React, { createContext, useState, useEffect, useContext } from 'react';
import axiosClient from '../api/axiosClient';
import { API_ENDPOINTS } from '../config/api.config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);

    // Listen for axiosClient token failure event
    const handleSessionExpired = () => {
      setUser(null);
      setIsAuthenticated(false);
    };

    window.addEventListener('auth_session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth_session_expired', handleSessionExpired);
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await axiosClient.post(API_ENDPOINTS.LOGIN, { email, password });
      const { tokens, user: userData } = response.data;
      
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check your credentials.'
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, roleId = 2) => {
    setLoading(true);
    try {
      await axiosClient.post(API_ENDPOINTS.REGISTER, {
        name,
        email,
        password,
        role_id: roleId
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed.'
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await axiosClient.post(API_ENDPOINTS.LOGOUT);
    } catch (error) {
      console.error('Logout error on server:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axiosClient.put(API_ENDPOINTS.PROFILE, profileData);
      const updatedUser = response.data; // Matches format returned from backend
      
      // Update local storage user details (role name should remain intact)
      const currentStored = JSON.parse(localStorage.getItem('user') || '{}');
      const newUserData = {
        id: updatedUser.id,
        name: updatedUser.full_name,
        email: updatedUser.email,
        role: updatedUser.role
      };
      
      localStorage.setItem('user', JSON.stringify(newUserData));
      setUser(newUserData);
      return { success: true, user: newUserData };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Profile update failed.'
      };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axiosClient.post(API_ENDPOINTS.CHANGE_PASSWORD, {
        current_password: currentPassword,
        new_password: newPassword
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password update failed.'
      };
    }
  };

  const forgotPassword = async (email) => {
    try {
      await axiosClient.post(API_ENDPOINTS.FORGOT_PASSWORD, { email });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password reset request failed.'
      };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      await axiosClient.post(API_ENDPOINTS.RESET_PASSWORD, { token, new_password: newPassword });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Reset password failed.'
      };
    }
  };

  // Helper utility to verify user permissions dynamically
  const hasRole = (allowedRoles) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        forgotPassword,
        resetPassword,
        hasRole
      }}
    >
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
