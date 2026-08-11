import React, { useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { Bot, Sparkles, Terminal, ShieldAlert, Award, FileSpreadsheet, UserX, Send } from 'lucide-react';

const AIAssistant = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');

  const executeCommand = async (commandText) => {
    const text = commandText || prompt;
    if (!text.trim() || loading) return;

    try {
      setLoading(true);
      setError('');
      setReply('');
      
      const { data } = await api.post('/ai/chat', {
        message: text,
        currentPage: 'AIAssistant'
      });
      setReply(data.reply);
    } catch (err) {
      console.error(err);
      setError("Sorry, I couldn't process that request right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const adminShortcuts = [
    { label: 'Create a Workshop', text: 'Create a technical workshop next Friday at 10 AM in Main Hall.' },
    { label: 'Show Inactive Students', text: 'Show inactive students who have not registered for any events.' },
    { label: 'Attendance Summary', text: 'Show attendance summary rates of completed events.' },
    { label: 'Send Reminders', text: 'Draft reminder emails for tomorrow\'s events.' }
  ];

  const studentShortcuts = [
    { label: 'What should I attend?', text: 'What should I attend based on my background?' },
    { label: 'My Certificates count', text: 'How many certificates do I have registered in my name?' },
    { label: 'Badges eligibility', text: 'What badges can I unlock next?' },
    { label: 'Events tomorrow', text: 'What events are tomorrow?' }
  ];

  return (
    <div className="flex-grow bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Terminal className="h-8 w-8 text-primary-650" />
            AI Copilot Assistant
          </h1>
          <p className="text-sm text-gray-500 mt-1">Directly instruct the assistant to compile reports, draft templates, or display records.</p>
        </div>

        {/* Shortcuts selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Admin console shortcuts */}
          <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-gray-450 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-purple-600" />
              Admin Copilot Actions
            </h3>
            <div className="flex gap-2 flex-wrap">
              {adminShortcuts.map((sc) => (
                <button
                  key={sc.label}
                  onClick={() => { setPrompt(sc.text); executeCommand(sc.text); }}
                  className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-100 text-purple-750 rounded-xl text-xs font-bold transition"
                >
                  {sc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Student queries shortcuts */}
          <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-gray-450 uppercase tracking-widest flex items-center gap-1.5">
              <Award className="h-4 w-4 text-blue-600" />
              Student Query Shortcuts
            </h3>
            <div className="flex gap-2 flex-wrap">
              {studentShortcuts.map((sc) => (
                <button
                  key={sc.label}
                  onClick={() => { setPrompt(sc.text); executeCommand(sc.text); }}
                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-750 rounded-xl text-xs font-bold transition"
                >
                  {sc.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input Terminal */}
        <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary-600" />
            <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">A.I. Interactive Console</span>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); executeCommand(); }} className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Instruct the assistant..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-grow px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="bg-primary-600 hover:bg-primary-750 text-white font-bold py-3 px-5 rounded-xl text-xs shadow-xs transition select-none flex items-center gap-1.5 shrink-0"
            >
              <Send className="h-4 w-4" />
              <span>Execute</span>
            </button>
          </form>

          {error && (
            <div className="text-xs p-3 bg-red-50 text-red-800 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-6 gap-2 text-xs text-gray-400 italic">
              <Loader size="small" /> Executive assistant is compiling details...
            </div>
          )}

          {reply && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs leading-relaxed font-semibold text-gray-800 whitespace-pre-wrap">
              <div className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1.5">Execution Log Output:</div>
              {reply}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AIAssistant;
