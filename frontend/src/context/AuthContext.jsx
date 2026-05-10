import React, { createContext, useState, useContext, useEffect } from 'react';
import { ticketApi } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (username, password) => {
    const res = await ticketApi.login(username, password);
    localStorage.setItem('token', res.data.access_token);
    await checkAuth();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const checkAuth = async () => {
    try {
      const res = await ticketApi.getMe();
      setUser(res.data);
    } catch (e) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('token')) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
