import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { Megaphone, Send, CheckCircle, AlertTriangle } from 'lucide-react';

const AnnouncementManager = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [targetValue, setTargetValue] = useState('');
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const departments = [
    'Computer Science (CSE)',
    'Civil Engineering (CE)',
    'Mechanical Engineering (ME)',
    'Electrical and Electronics Engineering (EEE)',
    'Electronics and Communication Engineering (ECE)',
    'Computer Science and Artificial Intelligence (CAI)',
    'Artificial Intelligence and Machine Learning (AIML)',
    'Information Technology (IT)',
    'Computer Science and Technology (CST)'
  ];
  const years = ['1', '2', '3', '4'];

  useEffect(() => {
    if (targetAudience === 'registered') {
      const fetchEvents = async () => {
        try {
          setLoadingEvents(true);
          const { data } = await api.get('/events?isTemplate=all');
          setEvents(data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingEvents(false);
        }
      };
      fetchEvents();
    }
  }, [targetAudience]);

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    setIsConfirmOpen(true);
  };

  const handleConfirmSend = async () => {
    setIsConfirmOpen(false);
    setSuccess('');
    setError('');
    setSending(true);

    try {
      const { data } = await api.post('/admin/announcements/broadcast', {
        title,
        content,
        targetAudience,
        targetValue,
      });
      setSuccess(data.message || 'Announcement broadcast successfully.');
      setTitle('');
      setContent('');
      setTargetValue('');
      setTargetAudience('all');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to broadcast announcement.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-grow bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Megaphone className="h-8 w-8 text-primary-600 animate-bounce" />
            Announcement Broadcasting Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">Compose system-wide alerts, department bulletins, or participant memos to send via in-app logs and SMTP emails.</p>
        </div>

        {/* Success/Error Alerts */}
        {success && (
          <div className="p-4 bg-green-50 text-green-800 rounded-xl border border-green-200 text-sm font-medium">
            {success}
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Composer Form */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-250 shadow-xs">
          <form onSubmit={handleBroadcastSubmit} className="space-y-5">
            
            {/* Target Criteria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Target Audience</label>
                <select
                  value={targetAudience}
                  onChange={(e) => {
                    setTargetAudience(e.target.value);
                    setTargetValue('');
                  }}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-primary-500"
                >
                  <option value="all">All Active Students</option>
                  <option value="department">By Department Segment</option>
                  <option value="year">By Year of Study</option>
                  <option value="registered">Registered for Event</option>
                  <option value="volunteers">Active Event Volunteers</option>
                </select>
              </div>

              {/* Dynamic Sub-criteria Values */}
              {targetAudience === 'department' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select Department</label>
                  <select
                    required
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-primary-500"
                  >
                    <option value="">-- Select department --</option>
                    {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}

              {targetAudience === 'year' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select Academic Year</label>
                  <select
                    required
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-primary-500"
                  >
                    <option value="">-- Select year --</option>
                    {years.map((y) => <option key={y} value={y}>{y} Year</option>)}
                  </select>
                </div>
              )}

              {targetAudience === 'registered' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select Event Catalog</label>
                  {loadingEvents ? (
                    <Loader size="small" />
                  ) : (
                    <select
                      required
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-primary-500"
                    >
                      <option value="">-- Select event --</option>
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title} ({new Date(ev.eventDate).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* Announcement Message Fields */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Announcement Subject / Headline</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Workshop Rescheduling Alert"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Message Content Description</label>
              <textarea
                rows={6}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write message details or notice description here..."
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm leading-relaxed"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={sending || !title || !content}
                className="flex items-center justify-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm shadow-sm transition disabled:opacity-50"
              >
                {sending ? <Loader size="small" /> : <Send className="h-4 w-4" />}
                <span>{sending ? 'Broadcasting...' : 'Broadcast Announcement'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Modal: Confirm Broadcast */}
        {isConfirmOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-gray-250 shadow-2xl text-center space-y-4">
              <div className="bg-primary-50 text-primary-650 p-3 rounded-full w-fit mx-auto border border-primary-100">
                <Megaphone className="h-8 w-8 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-gray-900 uppercase">Confirm Broadcast</h3>
                <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                  You are preparing to broadcast this notice to category segment: <strong>{targetAudience} ({targetValue || 'All'})</strong>.
                </p>
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 border border-amber-100 rounded-xl font-bold leading-normal">
                  ⚠ Crucial: This will trigger in-app updates and send SMTP emails to all resolved student recipients in that segment.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsConfirmOpen(false)}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSend}
                  className="flex-1 bg-primary-600 hover:bg-primary-750 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
                >
                  Yes, Send Broadcast
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AnnouncementManager;
