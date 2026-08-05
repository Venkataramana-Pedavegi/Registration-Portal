import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketProvider';
import Loader from '../components/Loader';
import { BarChart3, PieChart, ShieldAlert, Award, FileSpreadsheet, TrendingUp, Sparkles, BookMarked, Landmark } from 'lucide-react';

// Import Sprint 7 page subcomponents
import AnalyticsFilters from './AnalyticsFilters';
import ExecutiveDashboard from './ExecutiveDashboard';
import RegistrationAnalytics from './RegistrationAnalytics';
import AttendanceAnalytics from './AttendanceAnalytics';
import VolunteerAnalytics from './VolunteerAnalytics';
import DepartmentAnalytics from './DepartmentAnalytics';
import StudentAnalytics from './StudentAnalytics';
import TrendAnalysis from './TrendAnalysis';
import PredictiveInsights from './PredictiveInsights';
import ReportExport from './ReportExport';

const AnalyticsDashboard = () => {
  const socket = useSocket();
  const [biData, setBiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState('executive');

  // Filters State
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    department: '',
    year: '',
    category: '',
    status: '',
  });

  const fetchBIData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key]) {
          queryParams.append(key, filters[key]);
        }
      });

      const { data } = await api.get(`/bi/dashboard?${queryParams.toString()}`);
      setBiData(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to retrieve business intelligence dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBIData();
  }, []);

  // Real-time Socket.io Sync Hook
  useEffect(() => {
    if (!socket) return;

    const handleRealtimeUpdate = () => {
      console.log('⚡ [BI Socket] Real-time activity logged. Refreshing dashboard data...');
      fetchBIData();
    };

    socket.on('registration_created', handleRealtimeUpdate);
    socket.on('attendance_updated', handleRealtimeUpdate);
    socket.on('certificate_issued', handleRealtimeUpdate);
    socket.on('leaderboard_updated', handleRealtimeUpdate);

    return () => {
      socket.off('registration_created', handleRealtimeUpdate);
      socket.off('attendance_updated', handleRealtimeUpdate);
      socket.off('certificate_issued', handleRealtimeUpdate);
      socket.off('leaderboard_updated', handleRealtimeUpdate);
    };
  }, [socket, filters]);

  const handleApplyFilters = () => {
    fetchBIData();
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      startDate: '',
      endDate: '',
      department: '',
      year: '',
      category: '',
      status: '',
    };
    setFilters(defaultFilters);
    
    // Call API with empty query params immediately
    setTimeout(() => {
      api.get('/bi/dashboard').then(({ data }) => setBiData(data)).catch(console.error);
    }, 50);
  };

  const tabOptions = [
    { id: 'executive', label: 'Executive Overview', icon: BarChart3 },
    { id: 'registrations', label: 'Registrations', icon: BookMarked },
    { id: 'attendance', label: 'Attendance logs', icon: CheckSquareIcon },
    { id: 'volunteers', label: 'Volunteers', icon: Award },
    { id: 'departments', label: 'Departments', icon: Landmark },
    { id: 'students', label: 'Achievers', icon: TrophyIcon },
    { id: 'trends', label: 'Growth Trends', icon: TrendingUp },
    { id: 'predictive', label: 'Predictive (BI)', icon: Sparkles },
    { id: 'export', label: 'Report Builder', icon: FileSpreadsheet }
  ];

  // Helper icons maps to bypass lucide check
  function TrophyIcon(props) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5"
      >
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
        <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" />
      </svg>
    );
  }

  function CheckSquareIcon(props) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }

  return (
    <div className="flex-grow bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
      <div className="max-w-7xl mx-auto space-y-6 print:space-y-4">
        
        {/* Header */}
        <div className="flex justify-between items-center print:hidden">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <PieChart className="h-8 w-8 text-primary-600" />
              Executive BI Analytics
            </h1>
            <p className="text-sm text-gray-500 mt-1">Real-time indicators, registration growths, and predictive event forecasting.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl font-medium text-sm">
            {error}
          </div>
        )}

        {/* Filters Toolbar */}
        <div className="print:hidden">
          <AnalyticsFilters
            filters={filters}
            setFilters={setFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-250 select-none pb-0.5 gap-1.5 overflow-x-auto print:hidden">
          {tabOptions.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-400 hover:text-gray-655'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Rendering Active Tab content */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader size="large" /></div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'executive' && (
              <>
                <ExecutiveDashboard data={biData?.kpis} />
                
                {/* Event Performance Grid (Module 5) */}
                <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-gray-950 uppercase tracking-wider">Event Performance Summary</h3>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-250 text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3.5 text-left font-bold text-gray-500 uppercase tracking-wider">Event Title</th>
                            <th className="px-6 py-3.5 text-left font-bold text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3.5 text-center font-bold text-gray-500 uppercase tracking-wider">Registrations</th>
                            <th className="px-6 py-3.5 text-center font-bold text-gray-500 uppercase tracking-wider">Attendance %</th>
                            <th className="px-6 py-3.5 text-center font-bold text-gray-500 uppercase tracking-wider">Ratings</th>
                            <th className="px-6 py-3.5 text-center font-bold text-gray-500 uppercase tracking-wider">Popularity Score</th>
                            <th className="px-6 py-3.5 text-right font-bold text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 font-semibold text-gray-700">
                          {biData?.eventPerformance?.map((ev) => (
                            <tr key={ev.id} className="hover:bg-gray-55">
                              <td className="px-6 py-4 text-gray-900 font-black">{ev.title}</td>
                              <td className="px-6 py-4 text-gray-500 font-bold">{ev.category}</td>
                              <td className="px-6 py-4 text-center text-gray-655">{ev.registrations} / {ev.capacity}</td>
                              <td className="px-6 py-4 text-center text-green-600 font-black">{ev.attendancePct}%</td>
                              <td className="px-6 py-4 text-center text-amber-600 font-black">★ {ev.rating}</td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <span className="font-bold">{ev.popularityScore}%</span>
                                  <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${Math.min(ev.popularityScore, 100)}%` }} />
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                  ev.status === 'Completed' ? 'bg-green-50 text-green-700 border border-green-200' :
                                  ev.status === 'Cancelled' ? 'bg-red-50 text-red-755 border border-red-150' :
                                  'bg-amber-50 text-amber-700 border border-amber-250'
                                }`}>
                                  {ev.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'registrations' && (
              <RegistrationAnalytics data={biData?.charts} />
            )}

            {activeTab === 'attendance' && (
              <AttendanceAnalytics data={biData?.charts} eventPerformance={biData?.eventPerformance} />
            )}

            {activeTab === 'volunteers' && (
              <VolunteerAnalytics data={biData} />
            )}

            {activeTab === 'departments' && (
              <DepartmentAnalytics data={biData} />
            )}

            {activeTab === 'students' && (
              <StudentAnalytics data={biData} />
            )}

            {activeTab === 'trends' && (
              <TrendAnalysis data={biData} />
            )}

            {activeTab === 'predictive' && (
              <PredictiveInsights data={biData} />
            )}

            {activeTab === 'export' && (
              <ReportExport data={biData} />
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AnalyticsDashboard;
