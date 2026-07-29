import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import StatisticsCard from '../components/StatisticsCard';
import {
  RegistrationsPerEventChart,
  CategoryDistributionChart,
  MonthlyRegistrationsChart,
  DepartmentDistributionChart,
  StatusDistributionChart,
} from '../components/AnalyticsCharts';
import { Users, Calendar, BookMarked, Bookmark, XCircle, Award, CalendarDays, CheckCircle2, Landmark, PieChart } from 'lucide-react';

const AnalyticsDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashRes, analyticsRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/analytics'),
        ]);
        setDashboardData(dashRes.data);
        setAnalyticsData(analyticsRes.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to retrieve analytics dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-50">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <div className="flex-grow bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <PieChart className="h-8 w-8 text-primary-600" />
            Admin Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">Real-time metrics, event registration trends, and department distributions.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* 10 Dashboard Stat Cards */}
        {dashboardData && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatisticsCard title="Total Students" value={dashboardData.totalStudents} icon={Users} color="blue" />
            <StatisticsCard title="Total Events" value={dashboardData.totalEvents} icon={Calendar} color="indigo" />
            <StatisticsCard title="Total Signups" value={dashboardData.totalRegistrations} icon={BookMarked} color="purple" />
            <StatisticsCard title="Active Signups" value={dashboardData.activeRegistrations} icon={Bookmark} color="blue" />
            <StatisticsCard title="Cancelled Signups" value={dashboardData.cancelledRegistrations} icon={XCircle} color="red" />
            <StatisticsCard title="Completed Events" value={dashboardData.completedEvents} icon={Award} color="green" />
            <StatisticsCard title="Upcoming Events" value={dashboardData.upcomingEvents} icon={CalendarDays} color="yellow" />
            <StatisticsCard title="Seats Filled" value={dashboardData.seatsFilled} icon={CheckCircle2} color="green" />
            <StatisticsCard title="Available Seats" value={dashboardData.availableSeats} icon={Landmark} color="yellow" />
            <StatisticsCard title="Occupancy %" value={`${dashboardData.eventOccupancyPct}%`} icon={PieChart} color="purple" />
          </div>
        )}

        {/* 5 Recharts Graphs */}
        {analyticsData && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <RegistrationsPerEventChart data={analyticsData.registrationsPerEvent} />
              <CategoryDistributionChart data={analyticsData.categoryDistribution} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <MonthlyRegistrationsChart data={analyticsData.monthlyRegistrations} />
              <DepartmentDistributionChart data={analyticsData.departmentDistribution} />
            </div>

            <div className="max-w-2xl mx-auto w-full">
              <StatusDistributionChart data={analyticsData.statusDistribution} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AnalyticsDashboard;
