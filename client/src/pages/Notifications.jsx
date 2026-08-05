import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import Pagination from '../components/Pagination';
import { Bell, CheckCircle2, Award, Calendar, AlertCircle, Check, Trash2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { subscribeToUserNotifications } from '../services/socketService';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  const fetchNotifications = async (page = 1) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/notifications?page=${page}&limit=10`);
      setNotifications(data.notifications || []);
      setPagination(data.pagination || { page: 1, totalPages: 1 });
    } catch (err) {
      console.error(err);
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1);
  }, []);

  useEffect(() => {
    if (user?.id) {
      const unsubscribe = subscribeToUserNotifications(user.id, () => {
        fetchNotifications(1);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read', {});
      fetchNotifications(pagination.page);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkSingleRead = async (notificationId) => {
    try {
      await api.put('/notifications/read', { notificationId });
      fetchNotifications(pagination.page);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      fetchNotifications(pagination.page);
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'Certificate':
        return <Award className="h-5 w-5 text-amber-600" />;
      case 'Event':
        return <Calendar className="h-5 w-5 text-blue-600" />;
      case 'Registration':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      default:
        return <Bell className="h-5 w-5 text-purple-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-50">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <div className="flex-grow bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <Bell className="h-8 w-8 text-primary-600" />
              Notifications Center
            </h1>
            <p className="text-sm text-gray-500 mt-1">Stay updated with event reminders, registration changes, and certificate releases.</p>
          </div>

          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs border border-gray-300 shadow-xs transition duration-150 cursor-pointer"
          >
            <Check className="h-4 w-4 text-green-600" />
            <span>Mark All as Read</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* List */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-250 overflow-hidden divide-y divide-gray-150">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="font-semibold text-gray-700">No notifications found.</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id || item._id}
                className={`p-5 flex items-start gap-4 transition-colors duration-150 ${
                  item.isRead ? 'bg-white' : 'bg-blue-50/40'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-gray-100 border border-gray-200 shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div className="flex-grow space-y-1">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-gray-950 text-sm">{item.title}</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-gray-400 font-medium">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                      {!item.isRead && (
                        <button
                          onClick={() => handleMarkSingleRead(item.id || item._id)}
                          className="p-1.5 hover:bg-gray-150 text-gray-400 hover:text-green-600 rounded-lg transition cursor-pointer"
                          title="Mark as Read"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item.id || item._id)}
                        className="p-1.5 hover:bg-gray-150 text-gray-400 hover:text-red-650 rounded-lg transition cursor-pointer"
                        title="Delete Notification"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-650 leading-relaxed">{item.message}</p>
                </div>
              </div>
            ))
          )}

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => fetchNotifications(p)}
          />
        </div>

      </div>
    </div>
  );
};

export default Notifications;
