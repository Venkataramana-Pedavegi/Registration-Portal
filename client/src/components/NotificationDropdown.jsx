import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import NotificationItem from './NotificationItem';
import { Bell, CheckSquare, Trash2, ShieldAlert } from 'lucide-react';

const NotificationDropdown = ({ onClose }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();

  const dropdownRef = useRef(null);

  // Close dropdown on outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Display only the top 5 recent notifications in the dropdown
  const recentNotifications = notifications.slice(0, 5);

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-3.5 w-96 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[500px]"
    >
      {/* Dropdown Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
        <div className="flex items-center gap-2">
          <Bell className="h-4.5 w-4.5 text-primary-600" />
          <span className="text-sm font-bold text-gray-900">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={markAllAsRead}
              className="text-[10px] text-primary-650 hover:text-primary-800 font-bold flex items-center gap-1 cursor-pointer transition"
              title="Mark all as read"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
            <button
              onClick={clearAllNotifications}
              className="text-[10px] text-red-600 hover:text-red-850 font-bold flex items-center gap-1 cursor-pointer transition"
              title="Clear all notifications"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear all</span>
            </button>
          </div>
        )}
      </div>

      {/* Notifications List Container */}
      <div className="overflow-y-auto flex-grow p-3 space-y-2.5 divide-y divide-gray-50">
        {recentNotifications.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center space-y-2.5 text-gray-400">
            <ShieldAlert className="h-10 w-10 text-gray-300 stroke-[1.5]" />
            <div className="text-xs font-semibold">No recent notifications</div>
            <p className="text-[10px] text-gray-450 max-w-[200px]">We will notify you here when details change or certificates issue.</p>
          </div>
        ) : (
          recentNotifications.map((item) => (
            <div key={item._id || item.id} className="pt-2.5 first:pt-0">
              <NotificationItem
                item={item}
                onRead={markAsRead}
                onDelete={deleteNotification}
              />
            </div>
          ))
        )}
      </div>

      {/* View All Footer */}
      <Link
        to="/notifications"
        onClick={onClose}
        className="block text-center py-3 bg-gray-50 border-t border-gray-100 hover:bg-gray-100 text-xs font-bold text-gray-700 hover:text-primary-700 transition tracking-wide uppercase shrink-0"
      >
        View All Notifications
      </Link>
    </div>
  );
};

export default NotificationDropdown;
