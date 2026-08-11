import React, { createContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { ShieldAlert, LogOut, RefreshCw } from 'lucide-react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [role, setRole] = useState(localStorage.getItem('role') || null);
  const [loading, setLoading] = useState(true);

  // Inactivity timeout warning state
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds countdown
  const timerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const countdownRef = useRef(null);

  // Restore session
  useEffect(() => {
    const loadUser = async () => {
      if (token && role) {
        try {
          const endpoint = role === 'Admin' ? '/admin/profile' : '/student/profile';
          const { data } = await api.get(endpoint);
          setUser({
            ...data,
            isApprovedVolunteer: data.isApprovedVolunteer || false,
          });
          resetInactivityTimer();
        } catch (error) {
          console.error('Session restore failed:', error.response?.data?.message || error.message);
          logout();
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token, role]);

  // Token Auto-Refresh
  const refreshSession = async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) return false;

      const { data } = await api.post('/auth/refresh', { refreshToken: storedRefreshToken });
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      setToken(data.token);
      return true;
    } catch (err) {
      console.error('Session token refresh failed:', err);
      return false;
    }
  };

  // Inactivity Timer Rules
  const INACTIVITY_TIME = 14 * 60 * 1000; // 14 Minutes before warning

  const resetInactivityTimer = () => {
    if (!token) return;

    // Clear old timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    setShowTimeoutWarning(false);
    setTimeLeft(60);

    // Set new warning timer
    timerRef.current = setTimeout(() => {
      setShowTimeoutWarning(true);
      startWarningCountdown();
    }, INACTIVITY_TIME);
  };

  const startWarningCountdown = () => {
    let secondsLeft = 60;
    setTimeLeft(secondsLeft);

    countdownRef.current = setInterval(() => {
      secondsLeft -= 1;
      setTimeLeft(secondsLeft);
      if (secondsLeft <= 0) {
        clearInterval(countdownRef.current);
        logout();
      }
    }, 1000);
  };

  const handleContinueSession = async () => {
    const refreshed = await refreshSession();
    if (refreshed) {
      resetInactivityTimer();
    } else {
      logout();
    }
  };

  // Listen to user interactions to reset timer
  useEffect(() => {
    if (token && !showTimeoutWarning) {
      const events = ['mousemove', 'keydown', 'click', 'scroll'];
      const resetHandler = () => resetInactivityTimer();

      events.forEach((ev) => window.addEventListener(ev, resetHandler));
      resetInactivityTimer();

      return () => {
        events.forEach((ev) => window.removeEventListener(ev, resetHandler));
        if (timerRef.current) clearTimeout(timerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
      };
    }
  }, [token, showTimeoutWarning]);

  const loginStudent = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/student/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
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
        isApprovedVolunteer: data.isApprovedVolunteer || false,
      });
      resetInactivityTimer();
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
      localStorage.setItem('refreshToken', data.refreshToken || '');
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
      resetInactivityTimer();
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
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('role', 'Admin');
      setToken(data.token);
      setRole('Admin');
      setUser({
        _id: data._id,
        username: data.username,
        email: data.email,
        role: 'Admin',
      });
      resetInactivityTimer();
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Admin login failed';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout API failure:', e.message);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    setToken(null);
    setRole(null);
    setUser(null);
    setShowTimeoutWarning(false);
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
        setUser,
      }}
    >
      {children}

      {/* Responsive Session Timeout Warning Modal Dialog */}
      {showTimeoutWarning && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-65 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-gray-200 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-amber-50 text-amber-600 p-3 rounded-full w-fit mx-auto border border-amber-100">
              <ShieldAlert className="h-10 w-10 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-gray-900">Session Expiring</h3>
              <p className="text-xs text-gray-500">Your login session is about to expire due to inactivity in <span className="font-bold text-red-650 text-sm">{timeLeft}s</span>.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={logout}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition duration-150"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
              <button
                onClick={handleContinueSession}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition duration-150 shadow-xs"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Extend Session</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
