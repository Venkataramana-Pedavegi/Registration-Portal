import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { Sparkles, AlertCircle, CheckCircle2, Info, RefreshCw } from 'lucide-react';

const AIInsights = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/ai/insights');
      setInsights(data);
    } catch (err) {
      console.error(err);
      setError('Failed to generate analytical AI insights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs space-y-4">
      <div className="flex justify-between items-center pb-2.5 border-b border-gray-150">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-950 uppercase tracking-wider">
          <Sparkles className="h-4.5 w-4.5 text-primary-650 animate-pulse" />
          <span>Real-time Intelligent Insights (AI)</span>
        </div>
        <button
          onClick={fetchInsights}
          className="p-1 hover:bg-gray-100 rounded-lg text-xs font-bold text-primary-600 flex items-center gap-0.5"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="text-xs p-3 bg-red-50 text-red-800 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader size="small" /></div>
      ) : insights.length === 0 ? (
        <p className="text-xs text-gray-450 font-bold text-center py-2">No active insights generated yet.</p>
      ) : (
        <div className="space-y-3">
          {insights.map((ins, index) => {
            const Icon = ins.type === 'success' ? CheckCircle2 : ins.type === 'alert' ? AlertCircle : Info;
            return (
              <div
                key={index}
                className={`p-3.5 rounded-xl border flex gap-3 text-xs leading-normal font-semibold ${
                  ins.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
                  ins.type === 'alert' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                  'bg-gray-50 text-gray-800 border-gray-250'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${
                  ins.type === 'success' ? 'text-green-600' :
                  ins.type === 'alert' ? 'text-amber-600 animate-bounce' : 'text-gray-500'
                }`} />
                <div>
                  <strong className="block text-gray-950 font-black mb-0.5">{ins.metricName}</strong>
                  <span>{ins.insightText}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AIInsights;
