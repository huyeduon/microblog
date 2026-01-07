// frontend/src/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE_URL = 'http://127.0.0.1:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Will store { username, is_admin }
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(true);

  // Set up an Axios interceptor to include the token in all requests
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        // Extract username and is_admin from the token claims
        setUser({ username: decodedToken.sub, is_admin: decodedToken.is_admin });
      } catch (e) {
        console.error("Invalid token:", e);
        logout(); // Logout if token is invalid
      }
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, { username, password });
      // Store both access_token and user info (username, is_admin)
      const { access_token, username: loggedInUsername, is_admin } = response.data;
      setToken(access_token);
      setUser({ username: loggedInUsername, is_admin: is_admin });
      localStorage.setItem('access_token', access_token);
      return true;
    } catch (error) {
      console.error("Login failed:", error.response?.data?.msg || error.message);
      throw error;
    }
  };

  const register = async (username, password) => {
    try {
      await axios.post(`${API_BASE_URL}/register`, { username, password });
      return true;
    } catch (error) {
      console.error("Registration failed:", error.response?.data?.msg || error.message);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token,
    isAdmin: user?.is_admin || false, // Convenience boolean for admin status
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};