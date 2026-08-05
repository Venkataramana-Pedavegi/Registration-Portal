import React from 'react';
import { Users, Calendar, Award, BookMarked, CheckCircle2, Shield, TrendingUp, HelpCircle } from 'lucide-react';

const ExecutiveDashboard = ({ data }) => {
  if (!data) return null;

  const kpis = [
    {
      title: 'Total Students Registered',
      value: data.totalStudents,
      trend: '+12% from last sem',
      trendType: 'up',
      icon: Users,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'Total Organized Events',
      value: data.totalEvents,
      trend: '+4 templates saved',
      trendType: 'up',
      icon: Calendar,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Active Event Slates',
      value: data.activeEvents,
      trend: 'Ongoing or Upcoming',
      trendType: 'neutral',
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Completed Events',
      value: data.completedEvents,
      trend: 'Archived records ready',
      trendType: 'neutral',
      icon: Award,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      title: 'Upcoming Scheduled',
      value: data.upcomingEvents,
      trend: 'Public registration live',
      trendType: 'neutral',
      icon: Calendar,
      color: 'text-purple-650 bg-purple-50 border-purple-100',
    },
    {
      title: 'Registrations Logged Today',
      value: data.registrationsToday,
      trend: '+24% over yesterday',
      trendType: 'up',
      icon: BookMarked,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
    },
    {
      title: 'Registrations This Month',
      value: data.registrationsThisMonth,
      trend: 'Monthly signups goal',
      trendType: 'neutral',
      icon: BookMarked,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Certificates Generated',
      value: data.certificatesGenerated,
      trend: 'Earned participation',
      trendType: 'neutral',
      icon: Award,
      color: 'text-violet-600 bg-violet-50 border-violet-100',
    },
    {
      title: 'Average Attendance Rate',
      value: `${data.attendancePercentage}%`,
      trend: 'Target rate: 80%+',
      trendType: 'neutral',
      icon: CheckCircle2,
      color: 'text-cyan-600 bg-cyan-50 border-cyan-100',
    },
    {
      title: 'Active Event Volunteers',
      value: data.volunteerCount,
      trend: '+10 new approvals',
      trendType: 'up',
      icon: Shield,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
    {
      title: 'Event Success Clearance',
      value: `${data.eventSuccessRate}%`,
      trend: 'Rate of completion',
      trendType: 'neutral',
      icon: TrendingUp,
      color: 'text-pink-600 bg-pink-50 border-pink-100',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="bg-white p-5 rounded-2xl border border-gray-200 flex flex-col justify-between shadow-xs hover:shadow-md transition duration-200">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{kpi.title}</div>
                  <div className="text-2xl font-black text-gray-900 pt-1.5 leading-none">{kpi.value}</div>
                </div>
                <div className={`p-2.5 rounded-xl border ${kpi.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="flex items-center gap-1 mt-4 text-[10px] font-bold text-gray-400">
                {kpi.trendType === 'up' && <TrendingUp className="h-3.5 w-3.5 text-green-500" />}
                <span className={kpi.trendType === 'up' ? 'text-green-600' : 'text-gray-400'}>
                  {kpi.trend}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
