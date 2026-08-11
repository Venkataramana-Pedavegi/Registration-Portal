import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from './SocketProvider';
import { AuthContext } from './AuthContext';

const NotificationContext = createContext(null);

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const socket = useSocket();
  const { user } = useContext(AuthContext);

  const fetchNotifications = async (page = 1, limit = 10) => {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get(`/notifications?page=${page}&limit=${limit}`);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Unable to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
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
      fetchNotifications(pagination.page || 1, pagination.limit || 10);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
      setPagination({ page: 1, totalPages: 1, total: 0, limit: 10 });
    } catch (err) {
      console.error('Error clearing all notifications:', err);
    }
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setError('');
      return;
    }

    fetchNotifications(1, 10);
  }, [user]);

  // Listen to live socket events for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif) => {
      if (user?.id && notif.userId && parseInt(notif.userId, 10) !== parseInt(user.id, 10)) {
        return;
      }
      setNotifications((prev) => {
        const exists = prev.some((n) => (n.id && n.id === notif.id) || (n._id && n._id === notif._id));
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
    socket.on('notification', handleNewNotification);
    socket.on('notification:read', handleReadNotification);

    return () => {
      socket.off('notificationCreated', handleNewNotification);
      socket.off('notification:new', handleNewNotification);
      socket.off('notification', handleNewNotification);
      socket.off('notification:read', handleReadNotification);
    };
  }, [socket, user]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        pagination,
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
