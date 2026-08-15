import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter, MapPin, Clock, Users, X } from 'lucide-react';

const EventCalendar = () => {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedDateEvents, setSelectedDateEvents] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events');
      setEvents(res.data || []);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const totalDays = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const filteredEvents = events.filter((e) => {
    if (selectedDept !== 'All' && e.department && e.department !== selectedDept) return false;
    return true;
  });

  const getEventsForDay = (dayNum) => {
    return filteredEvents.filter((e) => {
      const d = new Date(e.eventDate);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === dayNum;
    });
  };

  const handleDayClick = (dayNum, dayEvents) => {
    const dStr = `${monthNames[month]} ${dayNum}, ${year}`;
    setSelectedDateStr(dStr);
    setSelectedDateEvents(dayEvents);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <CalendarIcon className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Event Calendar</h1>
              <p className="text-sm text-gray-500">Explore monthly and weekly schedule of campus events</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Departments</option>
              <option value="Computer Science and Artificial Intelligence (CAI)">Computer Science and Artificial Intelligence (CAI)</option>
              <option value="Artificial Intelligence and Machine Learning (AIML)">Artificial Intelligence and Machine Learning (AIML)</option>
              <option value="Information Technology (IT)">Information Technology (IT)</option>
              <option value="Computer Science and Technology (CST)">Computer Science and Technology (CST)</option>
            </select>

            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'month' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'week' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Week
              </button>
            </div>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">{monthNames[month]} {year}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 bg-gray-100 text-xs font-semibold rounded-xl text-gray-700 hover:bg-gray-200 transition"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-600"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="bg-gray-50 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                {d}
              </div>
            ))}

            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white min-h-[110px] p-2" />
            ))}

            {Array.from({ length: totalDays }).map((_, i) => {
              const dayNum = i + 1;
              const dayEvents = getEventsForDay(dayNum);
              const isToday =
                new Date().getDate() === dayNum &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={dayNum}
                  onClick={() => handleDayClick(dayNum, dayEvents)}
                  className={`bg-white min-h-[110px] p-2 hover:bg-indigo-50/50 cursor-pointer transition flex flex-col justify-between ${
                    isToday ? 'ring-2 ring-indigo-500 ring-inset' : ''
                  }`}
                >
                  <span className={`text-xs font-semibold inline-block w-6 h-6 leading-6 text-center rounded-full ${
                    isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'
                  }`}>
                    {dayNum}
                  </span>

                  <div className="mt-1 space-y-1 overflow-y-auto max-h-[70px]">
                    {dayEvents.slice(0, 2).map((evt) => (
                      <div
                        key={evt.id}
                        className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-medium truncate"
                      >
                        {evt.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-gray-500 font-semibold px-1">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Date Events Modal */}
      {selectedDateEvents !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setSelectedDateEvents(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Events on {selectedDateStr}</h3>
            <p className="text-xs text-gray-500 mb-4">{selectedDateEvents.length} event(s) scheduled</p>

            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No campus events scheduled on this date.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {selectedDateEvents.map((evt) => (
                  <div key={evt.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                        {evt.category}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {evt.startTime} - {evt.endTime}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900">{evt.title}</h4>
                    <p className="text-xs text-gray-600 line-clamp-2">{evt.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {evt.venue}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {evt.availableSeats} seats</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCalendar;
