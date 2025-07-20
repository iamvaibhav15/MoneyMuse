import { useState, useEffect, useContext, createContext } from 'react';
import { auth } from '../utils/auth';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (auth.isAuthenticated()) {
          const response = await authAPI.getMe();
          setUser(response.data.user);
        }
      } catch (error) {
        auth.logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;
      
      auth.setToken(token);
      auth.setUser(user);
      setUser(user);
      
      toast.success('Welcome back!');
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token, user } = response.data;
      
      auth.setToken(token);
      auth.setUser(user);
      setUser(user);
      
      toast.success('Account created successfully!');
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const googleLogin = async (googleToken) => {
    try {
      const response = await authAPI.googleAuth(googleToken);
      const { token, user } = response.data;
      
      auth.setToken(token);
      auth.setUser(user);
      setUser(user);
      
      toast.success('Welcome!');
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Google login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      const updatedUser = response.data.user;
      
      auth.setUser(updatedUser);
      setUser(updatedUser);
      
      toast.success('Profile updated successfully!');
      return { success: true, user: updatedUser };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      toast.success('Logged out successfully');
    } catch (error) {
      // Silent fail for logout
    } finally {
      auth.logout();
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    googleLogin,
    updateProfile,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};