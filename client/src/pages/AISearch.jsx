import React, { useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { Search, Sparkles, User, Calendar, Shield, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const AISearch = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim() || loading) return;

    try {
      setLoading(true);
      setError('');
      setResults(null);
      const { data } = await api.get(`/ai/smart-search?query=${encodeURIComponent(query)}`);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError('AI Smart Search failed to retrieve matching records.');
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (text) => {
    setQuery(text);
  };

  return (
    <div className="flex-grow bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Search className="h-8 w-8 text-primary-650" />
            AI Smart Search
          </h1>
          <p className="text-sm text-gray-500 mt-1">Query the system using conversational phrases to find Events, Students, or Volunteers.</p>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSearch} className="bg-white p-4 rounded-2xl border border-gray-250 shadow-xs flex items-center gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder='Try "find technical workshops" or "list ECE students" or "show active volunteers"...'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-primary-600 hover:bg-primary-750 text-white font-bold py-3 px-6 rounded-xl text-xs shadow-xs transition select-none flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="h-4 w-4 animate-spin-slow" />
            <span>Search</span>
          </button>
        </form>

        {/* Shortcut examples */}
        <div className="flex gap-2 flex-wrap items-center text-[10px] font-bold text-gray-450 uppercase tracking-wider">
          <span>Quick queries:</span>
          {['technical workshops', 'show CSE students', 'list volunteers'].map((ex) => (
            <button
              key={ex}
              onClick={() => handleExampleClick(ex)}
              className="px-2.5 py-1 bg-white hover:bg-primary-50 border border-gray-200 text-gray-700 rounded-md text-[10px] font-bold capitalize transition"
            >
              {ex}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 text-sm font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader size="large" /></div>
        ) : results ? (
          <div className="space-y-4">
            <h3 className="text-xs font-black text-gray-450 uppercase tracking-widest">
              Search Results ({results.results?.length || 0} matched {results.type})
            </h3>

            {results.results?.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-450 font-bold bg-white rounded-2xl border border-dashed flex flex-col items-center justify-center">
                <HelpCircle className="h-10 w-10 text-gray-300 mb-2" />
                <span>No matching records found. Try adjusting your vocabulary words!</span>
              </div>
            ) : (
              <div className="space-y-3">
                {/* 1. Events rendering */}
                {results.type === 'events' && results.results.map((ev) => (
                  <div key={ev.id} className="bg-white p-5 rounded-2xl border border-gray-250 flex justify-between items-center transition hover:border-primary-500">
                    <div className="space-y-1">
                      <span className="bg-primary-50 text-primary-750 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase">{ev.category}</span>
                      <h4 className="text-sm font-bold text-gray-900 pt-1.5">{ev.title}</h4>
                      <p className="text-[10px] text-gray-450 font-semibold">{new Date(ev.eventDate).toLocaleDateString()} • {ev.venue}</p>
                    </div>
                    <Link
                      to={`/events/${ev.id}`}
                      className="text-xs text-primary-650 hover:underline font-bold"
                    >
                      View Details
                    </Link>
                  </div>
                ))}

                {/* 2. Students rendering */}
                {results.type === 'students' && results.results.map((stud) => (
                  <div key={stud.id} className="bg-white p-4 rounded-2xl border border-gray-250 flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{stud.fullName}</h4>
                      <p className="text-[10px] text-gray-455 font-bold uppercase">{stud.rollNumber} • {stud.department} department • Year {stud.year}</p>
                    </div>
                  </div>
                ))}

                {/* 3. Volunteers rendering */}
                {results.type === 'volunteers' && results.results.map((v) => (
                  <div key={v.id} className="bg-white p-4 rounded-2xl border border-gray-250 flex items-center gap-3">
                    <div className="p-2.5 bg-purple-50 text-purple-650 rounded-xl">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-sm font-bold text-gray-900">{v.Student?.fullName}</h4>
                      <p className="text-[10px] text-gray-450 font-bold uppercase">
                        Event: {v.Event?.title} • Status: {v.status} • Hours: {v.hours} hrs
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

      </div>
    </div>
  );
};

export default AISearch;
