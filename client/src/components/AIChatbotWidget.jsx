import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { Bot, X, Send, Sparkles, User, RefreshCw } from 'lucide-react';

const AIChatbotWidget = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your Campus AI Assistant. How can I assist you with events, registrations, certificates, or attendance today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: userMsg,
        currentPage: location.pathname,
      });
      setMessages((prev) => [...prev, { sender: 'bot', text: res.data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Apologies, I encountered an issue processing your request. Please try again shortly.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (promptText) => {
    setInput(promptText);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:scale-105 transition-all flex items-center gap-2 group border border-white/20"
        >
          <Bot className="w-6 h-6 animate-pulse" />
          <span className="text-xs font-bold pr-1 hidden group-hover:inline">Ask AI Assistant</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-80 sm:w-96 h-[500px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                <Sparkles className="w-5 h-5 text-purple-200" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">Campus AI Assistant</h3>
                <span className="text-[10px] text-purple-200 font-medium">Intent-Aware AI Knowledge Base</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-gray-50/50 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[80%] whitespace-pre-wrap leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-xs font-medium'
                      : 'bg-white text-gray-800 border border-gray-100 shadow-xs rounded-bl-xs'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-gray-400 italic">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" /> AI is thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-1.5 bg-gray-100/70 border-t border-gray-100 flex gap-1.5 overflow-x-auto text-[10px]">
            <button
              onClick={() => handleQuickPrompt('I want to give feedback but I don\'t know where that option is.')}
              className="px-2 py-1 bg-white hover:bg-indigo-50 text-gray-600 rounded-md border text-nowrap"
            >
              ⭐ Where is feedback?
            </button>
            <button
              onClick={() => handleQuickPrompt('How do I download my certificate?')}
              className="px-2 py-1 bg-white hover:bg-indigo-50 text-gray-600 rounded-md border text-nowrap"
            >
              🎓 Certificates
            </button>
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-grow px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIChatbotWidget;
