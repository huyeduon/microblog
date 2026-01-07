// frontend/src/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react'; // <--- useContext imported here
import axios from 'axios';
import { API_BASE_URL } from './config';
// Create the AuthContext
export const AuthContext = createContext(null);

// AuthProvider component manages authentication state
export const AuthProvider = ({ children }) => {
  // State to hold user information (username, is_admin)
  const [user, setUser] = useState(null);
  // State to hold the JWT access token, initialized from localStorage
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  // State to indicate if the authentication status is currently being loaded
  const [loading, setLoading] = useState(true);

  // Effect to set up Axios interceptor and initialize user from token
  useEffect(() => {
    if (token) {
      // If a token exists, set it as the default Authorization header for all Axios requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      try {
        // Decode the JWT to extract user information (username and admin status)
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setUser({ username: decodedToken.sub, is_admin: decodedToken.is_admin });
      } catch (e) {
        // If token is invalid or decoding fails, log out the user
        console.error("Invalid token:", e);
        logout();
      }
    } else {
      // If no token, remove the Authorization header and clear user
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    }
    // Set loading to false once the initial authentication state is determined
    setLoading(false);
  }, [token]); // Re-run this effect whenever the token changes

  // Function to handle user login
  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, { username, password });
      // Extract access token and user details from the response
      const { access_token, username: loggedInUsername, is_admin } = response.data;
      setToken(access_token); // Update token state
      setUser({ username: loggedInUsername, is_admin: is_admin }); // Update user state
      localStorage.setItem('access_token', access_token); // Store token in localStorage
      return true; // Indicate successful login
    } catch (error) {
      console.error("Login failed:", error.response?.data?.msg || error.message);
      throw error; // Re-throw the error for component to handle
    }
  };

  // Function to handle user registration
  const register = async (username, password) => {
    try {
      await axios.post(`${API_BASE_URL}/register`, { username, password });
      return true; // Indicate successful registration
    } catch (error) {
      console.error("Registration failed:", error.response?.data?.msg || error.message);
      throw error; // Re-throw the error for component to handle
    }
  };

  // Function to handle user logout
  const logout = () => {
    setToken(null); // Clear token state
    setUser(null); // Clear user state
    localStorage.removeItem('access_token'); // Remove token from localStorage
    delete axios.defaults.headers.common['Authorization']; // Remove Authorization header
  };

  // The value provided by the AuthContext to its consumers
  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token, // Convenience boolean: true if token exists
    isAdmin: user?.is_admin || false, // Convenience boolean: true if user is admin
  };

  // Render the AuthContext.Provider, making 'value' available to children
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// The useAuth hook is now exported from this file again
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};