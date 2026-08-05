import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { MessageSquare, Sparkles, Smile, Frown, Megaphone, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const AIFeedbackAnalysis = () => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch list of events to select
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await api.get('/events');
        setEvents(data || []);
        if (data && data.length > 0) {
          setSelectedEventId(data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvents();
  }, []);

  const handleAnalyze = async () => {
    if (!selectedEventId) return;

    try {
      setLoading(true);
      setError('');
      setAnalysis(null);
      const { data } = await api.get(`/ai/feedback-analysis/${selectedEventId}`);
      setAnalysis(data);
    } catch (err) {
      console.error(err);
      setError('Failed to perform sentiment analysis for selected event feedback.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      handleAnalyze();
    }
  }, [selectedEventId]);

  const getSentimentColor = (sentiment) => {
    const s = String(sentiment).toLowerCase();
    if (s.includes('positive')) return 'text-green-700 bg-green-50 border-green-150';
    if (s.includes('negative')) return 'text-red-700 bg-red-50 border-red-150';
    return 'text-amber-700 bg-amber-50 border-amber-150';
  };

  // Sentiment Pie Chart data simulation
  const chartData = [
    { name: 'Positive Reviews', value: analysis?.overallSentiment?.toLowerCase() === 'negative' ? 20 : 70 },
    { name: 'Neutral Reviews', value: 20 },
    { name: 'Negative Reviews', value: analysis?.overallSentiment?.toLowerCase() === 'negative' ? 60 : 10 }
  ];
  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="flex-grow bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary-655" />
            AI Feedback Analysis
          </h1>
          <p className="text-sm text-gray-500 mt-1">Review student ratings, feedback sentiment, key compliments, and suggestions.</p>
        </div>

        {/* Dropdown selector */}
        <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:max-w-xs space-y-1">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Event</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 focus:ring-primary-500"
            >
              <option value="">Choose event...</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !selectedEventId}
            className="w-full sm:w-auto bg-primary-600 hover:bg-primary-750 text-white font-bold py-3.5 px-6 rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-1.5 shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            <span>Analyze Sentiments</span>
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 text-sm font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader size="large" /></div>
        ) : analysis ? (
          <div className="space-y-6">
            
            {/* Top row indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Sentiment Card */}
              <div className={`p-5 rounded-2xl border flex items-center gap-4 shadow-xs ${getSentimentColor(analysis.overallSentiment)}`}>
                {analysis.overallSentiment?.toLowerCase() === 'negative' ? (
                  <div className="p-3 bg-red-100 text-red-700 rounded-xl"><Frown className="h-6 w-6" /></div>
                ) : (
                  <div className="p-3 bg-green-100 text-green-700 rounded-xl"><Smile className="h-6 w-6" /></div>
                )}
                <div>
                  <div className="text-[10px] font-black text-gray-450 uppercase tracking-wider">Overall Sentiment</div>
                  <div className="text-lg font-black">{analysis.overallSentiment}</div>
                </div>
              </div>

              {/* Rating Card */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center gap-4 shadow-xs">
                <div className="p-3 bg-amber-50 text-amber-500 rounded-xl"><Sparkles className="h-6 w-6" /></div>
                <div>
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Average Satisfaction</div>
                  <div className="text-lg font-black text-gray-900">★ {analysis.averageSatisfaction} / 5.0</div>
                </div>
              </div>

              {/* Pie Chart display inside Card */}
              <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-center">
                <div className="h-24 w-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={35}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 9 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[9px] font-bold text-gray-400 space-y-0.5">
                  <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#10b981]" /> Positive</div>
                  <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> Neutral</div>
                  <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#ef4444]" /> Negative</div>
                </div>
              </div>

            </div>

            {/* Details lists */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Compliments list */}
              <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs space-y-3">
                <h4 className="text-xs font-black text-green-700 uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Top Compliments
                </h4>
                <ul className="text-xs font-semibold text-gray-650 space-y-2 list-disc list-inside">
                  {analysis.topCompliments?.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>

              {/* Complaints list */}
              <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs space-y-3">
                <h4 className="text-xs font-black text-red-700 uppercase tracking-widest flex items-center gap-1.5">
                  <Frown className="h-4 w-4 text-red-500" />
                  Common Complaints
                </h4>
                <ul className="text-xs font-semibold text-gray-650 space-y-2 list-disc list-inside">
                  {analysis.topComplaints?.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>

              {/* Suggestions list */}
              <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs space-y-3">
                <h4 className="text-xs font-black text-blue-700 uppercase tracking-widest flex items-center gap-1.5">
                  <Megaphone className="h-4 w-4 text-blue-500" />
                  Suggestions
                </h4>
                <ul className="text-xs font-semibold text-gray-655 space-y-2 list-disc list-inside">
                  {analysis.suggestions?.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>

            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
};

export default AIFeedbackAnalysis;
