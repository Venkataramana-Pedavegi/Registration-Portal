import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from './SocketProvider';
import { AuthContext } from './AuthContext';

const NotificationContext = createContext(null);

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const socket = useSocket();
  const { user } = useContext(AuthContext);

  const fetchNotifications = async (page = 1, limit = 10) => {
    if (!user) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/notifications?page=${page}&limit=${limit}`);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      // Update local state immediately
      setNotifications((prev) =>
        prev.map((n) => (n._id === id || n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id && n.id !== id));
      // Re-fetch to balance count & page limit
      fetchNotifications();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error clearing all notifications:', err);
    }
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();
  }, [user]);

  // Listen to live socket events for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif) => {
      // Avoid duplicate notifications in state
      setNotifications((prev) => {
        const exists = prev.some((n) => n.id === notif.id || n._id === notif._id);
        if (exists) return prev;
        return [notif, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
    };

    const handleReadNotification = (data) => {
      if (data.all) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      } else if (data.id) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === data.id || n._id === data.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    };

    socket.on('notificationCreated', handleNewNotification);
    socket.on('notification:new', handleNewNotification);
    socket.on('notification:read', handleReadNotification);

    return () => {
      socket.off('notificationCreated', handleNewNotification);
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:read', handleReadNotification);
    };
  }, [socket]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
