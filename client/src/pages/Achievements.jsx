import React, { useEffect, useState } from 'react';
import gamificationService from '../services/gamificationService';
import Loader from '../components/Loader';
import StudentRankCard from '../components/StudentRankCard';
import LevelProgress from '../components/LevelProgress';
import PointsCard from '../components/PointsCard';
import ActivityTimeline from '../components/ActivityTimeline';
import { Award, Compass, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const Achievements = () => {
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAchievementsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, summaryData] = await Promise.all([
        gamificationService.getProfileStats().catch((err) => {
          console.warn('[Achievements] Error fetching profile stats:', err);
          return null;
        }),
        gamificationService.getAchievements().catch((err) => {
          console.warn('[Achievements] Error fetching achievements summary:', err);
          return null;
        }),
      ]);

      if (!statsData && !summaryData) {
        throw new Error('Unable to retrieve achievements data from server.');
      }

      setStats(statsData || {
        student: { fullName: 'Student' },
        points: 0,
        level: 'Beginner',
        nextLevel: 'Bronze',
        progressPercentage: 0,
        remainingPoints: 100,
        rank: 1,
        volunteerHours: 0,
        badgesCount: 0,
        certsCount: 0,
      });

      setSummary(summaryData || {
        badges: [],
        certificates: [],
        completedEventsCount: 0,
        timeline: [],
      });
    } catch (err) {
      console.error('[Achievements] Fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load achievements data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievementsData();
  }, []);

  const badgesList = Array.isArray(summary?.badges) ? summary.badges : [];
  const timelineList = Array.isArray(summary?.timeline) ? summary.timeline : [];

  return (
    <div className="flex-grow bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-amber-500 fill-amber-100" />
              My Achievements
            </h1>
            <p className="text-sm text-gray-500 mt-1">Unlock standing levels, earn points, and build your student portfolio record.</p>
          </div>
          <Link
            to="/badges"
            className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition duration-150 shadow-xs"
          >
            <Award className="h-4 w-4 text-amber-500" />
            <span>View Badges Catalog</span>
          </Link>
        </div>

        {loading ? (
          <div className="py-16">
            <Loader size="large" />
          </div>
        ) : error && !stats ? (
          <div className="bg-white rounded-2xl border border-gray-250 p-8 text-center space-y-4 max-w-md mx-auto shadow-xs">
            <div className="bg-red-50 text-red-600 p-3.5 rounded-full w-fit mx-auto border border-red-150">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900">Unable to Load Achievements</h3>
              <p className="text-xs text-gray-500">{error}</p>
            </div>
            <button
              onClick={fetchAchievementsData}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition inline-flex items-center gap-2 shadow-xs"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Top Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <StudentRankCard
                student={stats?.student}
                points={stats?.points ?? 0}
                level={stats?.level || 'Beginner'}
                rank={stats?.rank ?? 1}
              />
              <LevelProgress
                level={stats?.level || 'Beginner'}
                nextLevel={stats?.nextLevel || 'Bronze'}
                progressPercentage={stats?.progressPercentage ?? 0}
                remainingPoints={stats?.remainingPoints ?? 0}
              />
            </div>

            {/* Points Summary cards */}
            <PointsCard
              points={stats?.points ?? 0}
              rank={stats?.rank ?? 1}
              volunteerHours={stats?.volunteerHours ?? 0}
              badgesCount={stats?.badgesCount ?? 0}
              certsCount={stats?.certsCount ?? 0}
            />

            {/* Split feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Unlocked badges list */}
              <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-250 p-6 shadow-xs h-fit space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Earned Badges</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Badges unlocked through portal activities.</p>
                </div>

                {badgesList.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400 font-bold">
                    No badges earned yet. Unlock your first by registering for an event!
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {badgesList.slice(0, 9).map((b) => (
                      <div
                        key={b.id || b._id}
                        title={b.Badge?.description || b.name}
                        className="flex flex-col items-center text-center p-2 rounded-xl hover:bg-amber-50/50 border border-transparent hover:border-amber-100 transition duration-150 cursor-help"
                      >
                        <div className="bg-amber-50 text-amber-600 p-2.5 rounded-full border border-amber-200">
                          <Award className="h-6 w-6" />
                        </div>
                        <span className="text-[9px] font-bold text-gray-800 truncate w-full mt-1.5">{b.Badge?.name || b.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Activity Timeline Feed */}
              <div className="lg:col-span-2">
                <ActivityTimeline logs={timelineList} />
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default Achievements;
