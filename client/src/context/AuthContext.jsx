import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [role, setRole] = useState(localStorage.getItem('role') || null);
  const [loading, setLoading] = useState(true);

  // Restore session
  useEffect(() => {
    const loadUser = async () => {
      if (token && role) {
        try {
          const endpoint = role === 'Admin' ? '/admin/profile' : '/student/profile';
          const { data } = await api.get(endpoint);
          setUser(data);
        } catch (error) {
          console.error('Session restore failed:', error.response?.data?.message || error.message);
          // Token expired or invalid
          logout();
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token, role]);

  const loginStudent = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/student/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', 'Student');
      setToken(data.token);
      setRole('Student');
      setUser({
        _id: data._id,
        fullName: data.fullName,
        rollNumber: data.rollNumber,
        email: data.email,
        department: data.department,
        year: data.year,
        role: 'Student',
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const registerStudent = async (studentData) => {
    setLoading(true);
    try {
      const { data } = await api.post('/student/register', studentData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', 'Student');
      setToken(data.token);
      setRole('Student');
      setUser({
        _id: data._id,
        fullName: data.fullName,
        rollNumber: data.rollNumber,
        email: data.email,
        department: data.department,
        year: data.year,
        role: 'Student',
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Registration failed';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const loginAdmin = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/admin/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', 'Admin');
      setToken(data.token);
      setRole('Admin');
      setUser({
        _id: data._id,
        username: data.username,
        email: data.email,
        role: 'Admin',
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Admin login failed';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setRole(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        loading,
        loginStudent,
        registerStudent,
        loginAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
