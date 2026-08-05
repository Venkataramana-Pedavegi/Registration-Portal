import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { Sparkles, Calendar, ChevronRight, HelpCircle, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

const AIRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/ai/recommendations');
      setRecommendations(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch personalized AI event recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return (
    <div className="flex-grow bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary-600 animate-pulse" />
            Recommended for You
          </h1>
          <p className="text-sm text-gray-500 mt-1">AI-powered event recommendation engine tailored to your department, academic year, and XP achievements.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 text-sm font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader size="large" /></div>
        ) : recommendations.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-450 font-bold bg-white rounded-2xl border border-dashed flex flex-col items-center justify-center">
            <HelpCircle className="h-10 w-10 text-gray-300 mb-2" />
            <span>We couldn't generate new recommendations right now. Please explore other events!</span>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => {
              const ev = rec.event || {};
              return (
                <div key={ev.id} className="bg-white p-5 rounded-2xl border border-gray-250 hover:border-primary-500 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition duration-200">
                  <div className="space-y-2 flex-grow">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary-50 text-primary-750 border border-primary-150 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md">
                        {ev.category}
                      </span>
                      <span className="bg-green-50 text-green-700 border border-green-200 text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-0.5">
                        <Trophy className="h-3 w-3" />
                        {rec.confidenceScore}% Match Score
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-gray-900">{ev.title}</h3>
                    <p className="text-xs text-gray-450 font-bold flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(ev.eventDate).toLocaleDateString()} • {ev.venue}</span>
                    </p>
                    
                    {/* Matching reason */}
                    <p className="text-xs text-indigo-700 font-semibold bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl leading-normal">
                      💡 {rec.reason}
                    </p>
                  </div>

                  <Link
                    to={`/events/${ev.id}`}
                    className="flex items-center gap-1 text-xs text-white bg-primary-600 hover:bg-primary-700 font-bold py-2.5 px-4 rounded-xl shadow-xs transition shrink-0"
                  >
                    <span>View Event Details</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default AIRecommendations;
