import React from 'react';
import { Calendar, CheckCircle2, Award, ArrowUpCircle, Settings } from 'lucide-react';

const ActivityTimeline = ({ logs }) => {
  const getIconForType = (type) => {
    switch (type) {
      case 'REGISTER_EVENT':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'ATTEND_EVENT':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'UNLOCK_BADGE':
        return <Award className="h-4 w-4 text-amber-500" />;
      case 'LEVEL_UP':
        return <ArrowUpCircle className="h-4 w-4 text-purple-500 animate-bounce" />;
      default:
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  const getBgColorForType = (type) => {
    switch (type) {
      case 'REGISTER_EVENT': return 'bg-blue-50 border-blue-200';
      case 'ATTEND_EVENT': return 'bg-green-50 border-green-200';
      case 'UNLOCK_BADGE': return 'bg-amber-50 border-amber-200';
      case 'LEVEL_UP': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-250 p-6 shadow-xs space-y-6">
      <div>
        <h4 className="text-sm font-bold text-gray-950">Activity Timeline Logs</h4>
        <p className="text-[10px] text-gray-400 mt-0.5">Your chronological achievements and registration logs on the portal.</p>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-10 text-xs text-gray-450 font-semibold">No recent activity logged. Start attending events to earn points!</div>
      ) : (
        <div className="relative pl-6 border-l border-gray-200 space-y-6 ml-3">
          {logs.map((log) => (
            <div key={log.id || log._id} className="relative space-y-1">
              
              {/* Point Indicator dot */}
              <div className={`absolute -left-[35px] top-0 p-1.5 rounded-full border ${getBgColorForType(log.type)}`}>
                {getIconForType(log.type)}
              </div>

              {/* Log Details */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">{log.description}</span>
                  <span className="text-[10px] text-gray-450 font-mono">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
                {log.pointsAwarded !== 0 && (
                  <span className={`inline-flex font-bold text-xs px-2.5 py-0.5 rounded-full ${
                    log.pointsAwarded > 0 ? 'bg-green-50 text-green-700 border border-green-150' : 'bg-red-50 text-red-700 border border-red-150'
                  }`}>
                    {log.pointsAwarded > 0 ? `+${log.pointsAwarded}` : log.pointsAwarded} XP
                  </span>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default ActivityTimeline;
