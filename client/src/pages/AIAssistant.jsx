import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import { 
  Bot, Sparkles, Terminal, ShieldAlert, Award, Search, Users, 
  UserCheck, Calendar, Trophy, FileText, Send, CheckCircle, Clock, MapPin 
} from 'lucide-react';

const AIAssistant = () => {
  const { role } = useContext(AuthContext);
  const isAdmin = ['Admin', 'Super Admin', 'Event Coordinator', 'Faculty Coordinator'].includes(role);

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [targetType, setTargetType] = useState(null);
  const [error, setError] = useState('');

  const executeCommand = async (commandText) => {
    const text = commandText || prompt;
    if (!text.trim() || loading) return;

    try {
      setLoading(true);
      setError('');
      setReply('');
      setSearchResults(null);
      setTargetType(null);
      
      const { data } = await api.post('/ai/assistant', {
        message: text,
        currentPage: 'AIAssistant'
      });

      setReply(data.reply || '');
      if (data.results && Array.isArray(data.results)) {
        setSearchResults(data.results);
        setTargetType(data.targetType || 'events');
      }
    } catch (err) {
      console.error(err);
      setError("Sorry, I couldn't process that request right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const quickShortcuts = [
    { label: '🔍 Search Events', text: 'Search technical workshop events' },
    { label: '📅 Tomorrow\'s Events', text: 'What events are tomorrow?' },
    ...(isAdmin ? [
      { label: '👥 Find Students', text: 'Show CSE students' },
      { label: '🙋 Find Volunteers', text: 'List approved volunteers' },
      { label: '📈 Attendance Summary', text: 'Show attendance summary rates of completed events.' },
      { label: '😴 Inactive Students', text: 'Show inactive students who have not registered for any events.' },
      { label: '📝 Create Workshop', text: 'Create a technical workshop next Friday at 10 AM in Main Hall.' },
    ] : [
      { label: '🏆 My Badges', text: 'What badge can I unlock next?' },
      { label: '📜 My Certificates', text: 'Show my certificates' },
      { label: '📊 My Attendance', text: 'How many events did I attend?' },
      { label: '🙋 My Volunteer Tasks', text: 'Show my volunteer tasks' },
      { label: '⭐ Recommendations', text: 'What should I attend based on my background?' },
    ])
  ];

  return (
    <div className="flex-grow bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
            <Bot className="w-64 h-64 text-white" />
          </div>
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white mb-1">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              Unified Intelligence Center
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
              🤖 AI Assistant
            </h1>
            <p className="text-sm md:text-base text-primary-100 max-w-2xl font-medium">
              Search the portal or ask me anything about your events, certificates, attendance, achievements and volunteers.
            </p>
          </div>
        </div>

        {/* Shortcuts selector */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
            <Terminal className="h-4 w-4 text-primary-600" />
            Quick Action Shortcuts & Search Triggers
          </h3>
          <div className="flex gap-2 flex-wrap">
            {quickShortcuts.map((sc) => (
              <button
                key={sc.label}
                onClick={() => { setPrompt(sc.text); executeCommand(sc.text); }}
                className="px-3 py-2 bg-gray-50 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 text-gray-700 hover:text-primary-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Terminal Console */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary-600" />
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Unified A.I. Console</span>
            </div>
            <span className="text-[11px] text-gray-400 font-semibold">Press Enter or click Send</span>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); executeCommand(); }} className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Ask or search anything... (e.g. 'technical workshops', 'How many XP do I have?')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-grow px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl text-xs shadow-xs transition select-none flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>Send</span>
            </button>
          </form>

          {error && (
            <div className="text-xs p-3.5 bg-red-50 text-red-800 rounded-xl border border-red-200 font-medium">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8 gap-2 text-xs text-gray-500 font-semibold italic">
              <Loader size="small" /> AI Assistant is processing your request...
            </div>
          )}

          {/* Text Execution Log Output */}
          {reply && (
            <div className="p-4 bg-gray-900 border border-gray-800 rounded-2xl text-xs leading-relaxed font-mono text-emerald-400 whitespace-pre-wrap shadow-inner space-y-2">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-800 pb-1.5 flex items-center justify-between">
                <span>Execution Log Output:</span>
                <span className="text-[9px] text-emerald-500 font-bold">STATUS 200 OK</span>
              </div>
              <div className="text-gray-100 font-sans text-xs pt-1">
                {reply}
              </div>
            </div>
          )}

          {/* Structured Search Result Cards */}
          {searchResults && searchResults.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-4 h-4 text-primary-600" />
                Structured Match Results ({searchResults.length})
              </h4>

              {targetType === 'events' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {searchResults.map((e) => (
                    <div key={e.id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-2xs space-y-1.5 hover:border-primary-300 transition">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-[10px] font-bold rounded-md uppercase">
                          {e.category}
                        </span>
                        <span className="text-[10px] font-semibold text-gray-400">
                          {new Date(e.eventDate).toLocaleDateString()}
                        </span>
                      </div>
                      <h5 className="font-bold text-gray-900 text-sm">{e.title}</h5>
                      <div className="text-xs text-gray-500 flex items-center gap-3">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" /> {e.venue}</span>
                        {e.availableSeats !== undefined && <span className="flex items-center gap-1"><Users className="w-3 h-3 text-gray-400" /> {e.availableSeats} seats left</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {targetType === 'students' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {searchResults.map((s) => (
                    <div key={s.id} className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-gray-900 text-xs">{s.fullName}</h5>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md">
                          {s.department}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-mono">Roll: {s.rollNumber}</p>
                      {s.email && <p className="text-[11px] text-gray-400">{s.email}</p>}
                    </div>
                  ))}
                </div>
              )}

              {targetType === 'volunteers' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {searchResults.map((v) => (
                    <div key={v.id} className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-gray-900 text-xs">{v.Student?.fullName || 'Volunteer'}</h5>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${v.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                          {v.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium">Department: {v.department || v.Student?.department || 'N/A'}</p>
                      <p className="text-[11px] text-gray-400">Event: {v.Event?.title || 'General'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default AIAssistant;
