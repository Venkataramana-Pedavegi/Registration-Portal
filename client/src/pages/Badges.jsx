import React, { useEffect, useState } from 'react';
import gamificationService from '../services/gamificationService';
import Loader from '../components/Loader';
import { Award, Lock, Sparkles, Calendar } from 'lucide-react';

const Badges = () => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const data = await gamificationService.getBadges();
      setBadges(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBadges();
  }, []);

  return (
    <div className="flex-grow bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Award className="h-8 w-8 text-amber-500 fill-amber-100" />
            Hall of Badges
          </h1>
          <p className="text-sm text-gray-500 mt-1">Unlock badges automatically by registering, attending events, and helping the campus community.</p>
        </div>

        {loading ? (
          <div className="py-16">
            <Loader size="large" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col items-center text-center space-y-4 transition-all duration-200 ${
                  badge.isUnlocked 
                    ? 'border-amber-200 hover:shadow-md' 
                    : 'border-gray-200 opacity-60'
                }`}
              >
                
                {/* Badge Icon circle */}
                <div className={`p-4 rounded-full border-2 relative ${
                  badge.isUnlocked 
                    ? 'bg-amber-50 text-amber-600 border-amber-200' 
                    : 'bg-gray-50 text-gray-400 border-gray-200'
                }`}>
                  <Award className="h-9 w-9" />
                  
                  {!badge.isUnlocked && (
                    <div className="absolute -bottom-1 -right-1 bg-gray-200 text-gray-550 p-1 rounded-full border border-white shadow-xs">
                      <Lock className="h-3 w-3" />
                    </div>
                  )}

                  {badge.isUnlocked && (
                    <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-0.5 rounded-full border border-white shadow-xs animate-pulse">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-gray-900">{badge.name}</h4>
                  <p className="text-[10px] text-gray-500 max-w-xs leading-relaxed">{badge.description}</p>
                </div>

                {/* Earned Date / Target details */}
                {badge.isUnlocked ? (
                  <div className="text-[10px] text-green-700 font-bold bg-green-50 px-2.5 py-1 rounded-lg border border-green-150 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Unlocked {new Date(badge.earnedDate).toLocaleDateString()}</span>
                  </div>
                ) : (
                  <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-150">
                    Rule: {badge.ruleType.replace('_', ' ')} ({badge.ruleValue})
                  </div>
                )}

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Badges;
