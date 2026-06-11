import React, { createContext, useState, useEffect, useContext } from 'react';
import { UserModel } from '../models/user.model.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await UserModel.getMe();
          setUser(userData);
        } catch (error) {
          console.error('Lỗi xác thực token:', error);
          logout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (emailOrUsername, password, rememberMe = false) => {
    setLoading(true);
    try {
      const data = await UserModel.login(emailOrUsername, password, rememberMe);
      localStorage.setItem('token', data.token);
      const { token: _t, ...userData } = data; // lưu tất cả trừ token
      setUser(userData);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Cập nhật một phần thông tin user trong state (dùng sau khi đổi MK bắt buộc)
  const updateUser = (patch) => setUser(prev => prev ? { ...prev, ...patch } : prev);

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    return user.permissions ? user.permissions.includes(permission) : false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasPermission, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng trong AuthProvider');
  }
  return context;
};
