import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Trophy, Medal, Award, Flame, Search, ChevronLeft, ChevronRight, Star, Clock, Calendar, Shield } from 'lucide-react';
import Loader from '../components/Loader';

const LeaderboardPage = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [timeframe, setTimeframe] = useState('overall'); // 'overall', 'monthly', 'yearly'
  const [sortBy, setSortBy] = useState('points'); // 'points', 'volunteer', 'certificates', 'events', 'attendance'
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0, limit: 10 });

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/leaderboard`, {
        params: {
          page,
          limit: 10,
          sortBy,
          department: department || undefined,
          year: year || undefined,
          timeframe,
          search: search || undefined,
        }
      });
      setRankings(res.data.rankings);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Error fetching leaderboard rankings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, [page, sortBy, department, year, timeframe]);

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchRankings();
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  const getTrophyEmoji = (rank) => {
    if (rank === 1) return '🏆';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const getTrophyColorClass = (rank) => {
    if (rank === 1) return 'bg-amber-50 border-amber-200 text-amber-600';
    if (rank === 2) return 'bg-slate-50 border-slate-200 text-slate-500';
    if (rank === 3) return 'bg-orange-50 border-orange-200 text-amber-800';
    return 'bg-gray-50 border-gray-150 text-gray-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl p-8 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-amber-400/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold">
              <Flame className="w-4 h-4 text-amber-200" /> Sri Vasavi Event Portal
            </div>
            <h1 className="text-3xl font-black tracking-tight">Student Hall of Fame</h1>
            <p className="text-amber-100 text-sm max-w-xl">
              Compare rankings, inspect active volunteers, and see who has participated the most across departments!
            </p>
          </div>
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center gap-4 shrink-0">
            <Trophy className="w-12 h-12 text-amber-200 animate-bounce" />
            <div>
              <span className="text-xs uppercase tracking-wider text-amber-200 font-bold block">Top Position</span>
              <span className="text-lg font-bold">Event Champion</span>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white rounded-2xl border border-gray-250 p-6 shadow-xs space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students by name..."
                className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-xs"
              />
            </div>

            {/* Department Filter */}
            <select
              value={department}
              onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
              className="block w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
            >
              <option value="">All Departments</option>
              <option value="CSE">Computer Science (CSE)</option>
              <option value="ECE">Electronics (ECE)</option>
              <option value="EEE">Electrical (EEE)</option>
              <option value="MECH">Mechanical (MECH)</option>
              <option value="CIVIL">Civil (CIVIL)</option>
              <option value="MBA">Business Admin (MBA)</option>
              <option value="MCA">Computer Applications (MCA)</option>
            </select>

            {/* Year Filter */}
            <select
              value={year}
              onChange={(e) => { setYear(e.target.value); setPage(1); }}
              className="block w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
            >
              <option value="">All Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>

            {/* Timeframe Filter */}
            <select
              value={timeframe}
              onChange={(e) => { setTimeframe(e.target.value); setPage(1); }}
              className="block w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
            >
              <option value="overall">All-Time Statistics</option>
              <option value="monthly">This Month</option>
              <option value="yearly">This Year</option>
            </select>

          </div>

          {/* Metric Sort Tabs */}
          <div className="flex flex-wrap gap-2 border-t border-gray-150 pt-4">
            <button
              onClick={() => { setSortBy('points'); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                sortBy === 'points' ? 'bg-amber-500 text-white shadow-xs' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Star className="h-4 w-4" /> Most Points
            </button>
            <button
              onClick={() => { setSortBy('volunteer'); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                sortBy === 'volunteer' ? 'bg-amber-500 text-white shadow-xs' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Clock className="h-4 w-4" /> Volunteer Hours
            </button>
            <button
              onClick={() => { setSortBy('certificates'); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                sortBy === 'certificates' ? 'bg-amber-500 text-white shadow-xs' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Award className="h-4 w-4" /> Certificates
            </button>
            <button
              onClick={() => { setSortBy('events'); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                sortBy === 'events' ? 'bg-amber-500 text-white shadow-xs' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Calendar className="h-4 w-4" /> Event Signups
            </button>
            <button
              onClick={() => { setSortBy('attendance'); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                sortBy === 'attendance' ? 'bg-amber-500 text-white shadow-xs' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Trophy className="h-4 w-4" /> Attendance Present
            </button>
          </div>

        </div>

        {/* Leaderboard Table List */}
        {loading ? (
          <div className="py-16">
            <Loader size="large" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-250 overflow-hidden shadow-xs">
            
            <div className="divide-y divide-gray-150">
              
              {rankings.length === 0 ? (
                <div className="p-12 text-center text-xs text-gray-450 font-bold">
                  No student rankings match your filter selections.
                </div>
              ) : (
                rankings.map((student) => (
                  <div
                    key={student.studentId}
                    className={`p-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition duration-150 hover:bg-gray-50/50 ${
                      student.rank <= 3 ? 'bg-amber-50/15' : ''
                    }`}
                  >
                    
                    {/* Rank & Student Info */}
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      
                      {/* Trophy or Number Badge */}
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center font-black text-xs border ${getTrophyColorClass(student.rank)}`}>
                        {getTrophyEmoji(student.rank) || student.rank}
                      </div>

                      {/* Avatar */}
                      <div className="w-[42px] h-[42px] rounded-full overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                        <img
                          src={student.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                          alt={student.fullName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Details */}
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                          {student.fullName}
                          <span className="bg-primary-50 text-primary-650 px-2 py-0.5 rounded-full text-[9px] font-bold border border-primary-100 uppercase">
                            {student.level}
                          </span>
                        </h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{student.department} • {student.year}</p>
                      </div>

                    </div>

                    {/* Stats columns */}
                    <div className="flex flex-wrap gap-4 text-center sm:text-right shrink-0">
                      
                      <div className="px-3 border-r border-gray-150">
                        <span className="text-[9px] text-gray-450 font-bold block uppercase tracking-wider">Total XP</span>
                        <span className="text-sm font-black text-amber-600">{student.points} XP</span>
                      </div>

                      <div className="px-3 border-r border-gray-150">
                        <span className="text-[9px] text-gray-450 font-bold block uppercase tracking-wider">Volunteer</span>
                        <span className="text-sm font-black text-purple-600">{student.volunteerHours} Hrs</span>
                      </div>

                      <div className="px-3">
                        <span className="text-[9px] text-gray-450 font-bold block uppercase tracking-wider">Present</span>
                        <span className="text-sm font-black text-green-700">{student.attCount} / {student.regCount}</span>
                      </div>

                    </div>

                  </div>
                ))
              )}

            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="bg-gray-50 border-t border-gray-150 px-6 py-4 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-bold">
                  Showing page {pagination.page} of {pagination.totalPages}
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 transition duration-150"
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-650" />
                  </button>
                  <button
                    disabled={page === pagination.totalPages}
                    onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                    className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 transition duration-150"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-650" />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default LeaderboardPage;
