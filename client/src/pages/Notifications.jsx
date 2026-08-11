import React, { useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import Pagination from '../components/Pagination';
import { Bell, CheckCircle2, Award, Calendar, Check, Trash2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const Notifications = () => {
  const { user } = useContext(AuthContext);
  const {
    notifications,
    loading,
    error,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  useEffect(() => {
    fetchNotifications(1, 10);
  }, []);

  const getDestinationPath = (item) => {
    const role = user?.role || 'Student';
    const isAdmin = ['Admin', 'Super Admin', 'Event Coordinator', 'Faculty Coordinator'].includes(role);
    if (isAdmin) {
      switch (item.title) {
        case 'New Event Registration':
          return item.referenceId ? `/events/${item.referenceId}/participants` : '/admin-dashboard';
        case 'New Volunteer Application':
          return '/volunteers';
        case 'New Event Feedback':
          return '/analytics-dashboard';
        case 'Event Created':
        case 'Event Updated':
          return item.referenceId ? `/events/${item.referenceId}` : '/admin-dashboard';
        case 'Event Cancelled':
          return '/admin-dashboard';
        case 'Certificates Generated':
          return '/attendance';
        case 'Event Entry Verified':
          return '/admin/entry-verification';
        default:
          return item.referenceId ? `/events/${item.referenceId}` : '/admin-dashboard';
      }
    } else {
      // Student routing
      return item.referenceId ? `/events/${item.referenceId}` : '/student-dashboard';
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
      <div className="flex-grow flex items-center justify-center bg-gray-50 py-16 flex-col gap-3">
        <Loader size="large" />
        <p className="text-sm font-semibold text-gray-600">Loading notifications...</p>
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
            <p className="text-sm text-gray-500 mt-1">
              Stay updated with system activities, event updates, registrations, and certificate releases.
            </p>
          </div>

          {notifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs border border-gray-300 shadow-xs transition duration-150 cursor-pointer shrink-0"
            >
              <Check className="h-4 w-4 text-green-600" />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center font-medium">
            {error}
          </div>
        ) : (
          /* List */
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
                      <Link
                        to={getDestinationPath(item)}
                        onClick={() => !item.isRead && markAsRead(item.id || item._id)}
                        className="font-bold text-gray-950 text-sm hover:text-primary-600 transition cursor-pointer block"
                      >
                        {item.title}
                      </Link>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-gray-400 font-medium">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                        {!item.isRead && (
                          <button
                            onClick={() => markAsRead(item.id || item._id)}
                            className="p-1.5 hover:bg-gray-150 text-gray-400 hover:text-green-600 rounded-lg transition cursor-pointer"
                            title="Mark as Read"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(item.id || item._id)}
                          className="p-1.5 hover:bg-gray-150 text-gray-400 hover:text-red-650 rounded-lg transition cursor-pointer"
                          title="Delete Notification"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <Link
                      to={getDestinationPath(item)}
                      onClick={() => !item.isRead && markAsRead(item.id || item._id)}
                      className="text-xs text-gray-650 leading-relaxed hover:opacity-85 transition cursor-pointer block"
                    >
                      {item.message}
                    </Link>
                  </div>
                </div>
              ))
            )}

            {pagination && pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(p) => fetchNotifications(p, 10)}
              />
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Notifications;
