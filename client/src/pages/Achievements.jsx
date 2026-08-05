import React, { useEffect, useState } from 'react';
import gamificationService from '../services/gamificationService';
import Loader from '../components/Loader';
import StudentRankCard from '../components/StudentRankCard';
import LevelProgress from '../components/LevelProgress';
import PointsCard from '../components/PointsCard';
import ActivityTimeline from '../components/ActivityTimeline';
import { Award, Compass, Sparkles, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Achievements = () => {
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAchievementsData = async () => {
    try {
      setLoading(true);
      const [statsData, summaryData] = await Promise.all([
        gamificationService.getProfileStats(),
        gamificationService.getAchievements(),
      ]);
      setStats(statsData);
      setSummary(summaryData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievementsData();
  }, []);

  return (
    <div className="flex-grow bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
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
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Top Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <StudentRankCard
                student={stats.student}
                points={stats.points}
                level={stats.level}
                rank={stats.rank}
              />
              <LevelProgress
                level={stats.level}
                nextLevel={stats.nextLevel}
                progressPercentage={stats.progressPercentage}
                remainingPoints={stats.remainingPoints}
              />
            </div>

            {/* Points Summary cards */}
            <PointsCard
              points={stats.points}
              rank={stats.rank}
              volunteerHours={stats.volunteerHours}
              badgesCount={stats.badgesCount}
              certsCount={stats.certsCount}
            />

            {/* Split feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Unlocked badges list */}
              <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-250 p-6 shadow-xs h-fit space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Earned Badges</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Badges unlocked through portal activities.</p>
                </div>

                {summary.badges.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400 font-bold">
                    No badges earned yet. Unlock your first by registering for an event!
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {summary.badges.slice(0, 9).map((b) => (
                      <div
                        key={b.id || b._id}
                        title={b.Badge?.description}
                        className="flex flex-col items-center text-center p-2 rounded-xl hover:bg-amber-50/50 border border-transparent hover:border-amber-100 transition duration-150 cursor-help"
                      >
                        <div className="bg-amber-50 text-amber-600 p-2.5 rounded-full border border-amber-200">
                          <Award className="h-6 w-6" />
                        </div>
                        <span className="text-[9px] font-bold text-gray-800 truncate w-full mt-1.5">{b.Badge?.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Activity Timeline Feed */}
              <div className="lg:col-span-2">
                <ActivityTimeline logs={summary.timeline} />
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default Achievements;
