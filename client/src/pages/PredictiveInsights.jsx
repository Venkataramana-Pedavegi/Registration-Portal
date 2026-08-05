import React from 'react';
import { Sparkles, BarChart, Users, Compass, AlertCircle } from 'lucide-react';

const PredictiveInsights = ({ data }) => {
  if (!data || !data.predictive) return null;

  const pred = data.predictive;

  const insights = [
    {
      title: 'Expected Attendance Rate',
      desc: `We predict an average attendance rate of ${pred.expectedAttendanceRate}% for upcoming events of category "${pred.mostPopularCategory}".`,
      icon: Users,
      badge: `${pred.expectedAttendanceRate}% Predicted`,
      badgeColor: 'bg-green-150 text-green-700',
    },
    {
      title: 'High Demand Category',
      desc: `"${pred.mostPopularCategory}" events are projected to remain in highest student demand, showing peak registration occupancy rates.`,
      icon: Compass,
      badge: 'Top Choice',
      badgeColor: 'bg-blue-150 text-blue-700',
    },
    {
      title: 'Volunteer Strength Estimate',
      desc: `We project a baseline requirement of ${pred.volunteerNeedEstimate} volunteers to comfortably manage active participant check-ins.`,
      icon: Sparkles,
      badge: `${pred.volunteerNeedEstimate} volunteers needed`,
      badgeColor: 'bg-purple-150 text-purple-700',
    },
    {
      title: 'Registration Volatility Forecast',
      desc: `Predictive trend heuristics indicate an ${pred.registrationGrowthPrediction} velocity over the next 30 days.`,
      icon: BarChart,
      badge: '15% Growth',
      badgeColor: 'bg-amber-150 text-amber-700',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Title */}
      <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 flex gap-3 text-xs text-primary-850">
        <AlertCircle className="h-5 w-5 shrink-0 text-primary-600 animate-pulse" />
        <div className="space-y-1">
          <span className="font-extrabold uppercase text-primary-900">💡 Analytics Predictive Intelligence (BI)</span>
          <p className="font-semibold leading-relaxed">
            These forecasting estimations are computed in real time based on historical enrollment occupancies, volunteer-to-attendee coefficients, and check-in no-show statistics.
          </p>
        </div>
      </div>

      {/* Grid of predictive cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {insights.map((ins, index) => {
          const Icon = ins.icon;
          return (
            <div key={index} className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs flex gap-4 hover:shadow-md transition">
              <div className="p-3 bg-gray-50 border border-gray-150 text-primary-600 rounded-xl h-fit">
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-2 flex-grow">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">{ins.title}</h4>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${ins.badgeColor}`}>{ins.badge}</span>
                </div>
                <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                  {ins.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default PredictiveInsights;
