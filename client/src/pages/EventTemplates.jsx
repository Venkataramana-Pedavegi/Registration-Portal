import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { Copy, Plus, Clipboard, Calendar, Trash2, ArrowRight } from 'lucide-react';

const EventTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Tab state: 'templates' vs 'convert'
  const [activeTab, setActiveTab] = useState('templates');

  // Clone Modal Form
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isCloneOpen, setIsCloneOpen] = useState(false);
  const [cloneTitle, setCloneTitle] = useState('');
  const [cloneVenue, setCloneVenue] = useState('');
  const [cloneDate, setCloneDate] = useState('');
  const [cloneStart, setCloneStart] = useState('');
  const [cloneEnd, setCloneEnd] = useState('');
  const [cloneDeadline, setCloneDeadline] = useState('');
  const [cloneCapacity, setCloneCapacity] = useState('100');
  const [cloning, setCloning] = useState(false);

  // New Template Modal Form
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Technical');
  const [newVenue, setNewVenue] = useState('');
  const [newCapacity, setNewCapacity] = useState('100');
  const [creating, setCreating] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  const handleGenerateAIDescription = async () => {
    if (!newTitle) {
      alert('Please enter a Template Title first so the AI knows what the event is about!');
      return;
    }
    try {
      setGeneratingAI(true);
      const res = await api.post('/ai/generate-description', {
        title: newTitle,
        category: newCategory,
        venue: newVenue || 'Sri Vasavi Engineering College'
      });
      const { description, objectives, benefits, agenda, socialMediaCaption, keywords } = res.data;
      const compositeDesc = `${description}\n\nObjectives:\n${objectives}\n\nBenefits:\n${benefits}\n\nAgenda:\n${agenda}\n\nSocial Media:\n${socialMediaCaption}\n\nKeywords: ${keywords}`;
      setNewDesc(compositeDesc);
    } catch (err) {
      console.error(err);
      alert('Failed to generate AI description template.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const categories = ['Technical', 'Cultural', 'Sports', 'Seminar', 'Workshop', 'Other'];

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const templatesRes = await api.get('/events?isTemplate=true');
      setTemplates(templatesRes.data);

      const eventsRes = await api.get('/events');
      setAllEvents(eventsRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load event data templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenClone = (tmpl) => {
    setSelectedTemplate(tmpl);
    setCloneTitle(`${tmpl.title} (Clone)`);
    setCloneVenue(tmpl.venue || '');
    setCloneCapacity(String(tmpl.capacity || 100));
    setCloneStart(tmpl.startTime || '09:00');
    setCloneEnd(tmpl.endTime || '12:00');
    setCloneDate('');
    setCloneDeadline('');
    setIsCloneOpen(true);
  };

  const handleCloneSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setCloning(true);

    try {
      await api.post('/events', {
        title: cloneTitle,
        description: selectedTemplate.description,
        category: selectedTemplate.category,
        venue: cloneVenue,
        eventDate: cloneDate,
        startTime: cloneStart,
        endTime: cloneEnd,
        registrationDeadline: cloneDeadline,
        organizer: selectedTemplate.organizer || 'College Admin',
        capacity: parseInt(cloneCapacity) || 100,
        image: selectedTemplate.image,
        registrationType: selectedTemplate.registrationType || 'FREE',
        price: selectedTemplate.price || 0,
        isTemplate: false,
      });

      setSuccess(`Successfully duplicated and scheduled event: "${cloneTitle}"`);
      setIsCloneOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to clone event template.');
    } finally {
      setCloning(false);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setCreating(true);

    try {
      // Set future dummy dates since templates require date structures in DB schema validations
      const dummyDate = new Date();
      dummyDate.setFullYear(dummyDate.getFullYear() + 1);

      await api.post('/events', {
        title: newTitle,
        description: newDesc,
        category: newCategory,
        venue: newVenue,
        eventDate: dummyDate.toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        registrationDeadline: dummyDate.toISOString().split('T')[0],
        organizer: 'Coordinators Office',
        capacity: parseInt(newCapacity) || 100,
        isTemplate: true,
      });

      setSuccess(`Successfully registered event template: "${newTitle}"`);
      setIsCreateOpen(false);
      
      // Reset forms
      setNewTitle('');
      setNewDesc('');
      setNewCategory('Technical');
      setNewVenue('');
      setNewCapacity('100');
      
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to register new template.');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveAsTemplate = async (eventId, title) => {
    setSuccess('');
    setError('');
    try {
      await api.put(`/events/${eventId}`, { isTemplate: true });
      setSuccess(`Event "${title}" has been saved as a reusable template.`);
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Failed to convert event into a template.');
    }
  };

  const handleRemoveTemplate = async (eventId, title) => {
    if (!window.confirm(`Are you sure you want to delete template "${title}"?`)) return;
    setSuccess('');
    setError('');
    try {
      await api.delete(`/events/${eventId}`);
      setSuccess('Template deleted successfully.');
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Failed to delete event template.');
    }
  };

  return (
    <div className="flex-grow bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <Clipboard className="h-8 w-8 text-primary-600" />
              Event Templates & Cloning
            </h1>
            <p className="text-sm text-gray-500 mt-1">Design event blueprint templates or duplicate completed schedules to instantiate new live events.</p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Event Template</span>
          </button>
        </div>

        {/* Banners */}
        {success && (
          <div className="p-4 bg-green-50 text-green-800 rounded-xl border border-green-200 text-sm font-medium">
            {success}
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Tab options */}
        <div className="flex border-b border-gray-250 select-none pb-0.5 gap-2">
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'templates'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-400 hover:text-gray-655'
            }`}
          >
            Active Blueprints Templates ({templates.length})
          </button>
          <button
            onClick={() => setActiveTab('convert')}
            className={`py-2 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'convert'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-400 hover:text-gray-655'
            }`}
          >
            Save Past Event as Template
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader size="large" /></div>
        ) : activeTab === 'templates' ? (
          templates.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-450 font-bold bg-white rounded-2xl border border-dashed">
              No active templates registered yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((tmpl) => (
                <div key={tmpl.id} className="bg-white rounded-2xl border border-gray-250 overflow-hidden shadow-xs flex flex-col justify-between p-5 space-y-4">
                  <div className="space-y-2">
                    <span className="bg-primary-50 text-primary-750 border border-primary-150 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md">
                      {tmpl.category}
                    </span>
                    <h3 className="text-base font-extrabold text-gray-900 leading-snug">{tmpl.title}</h3>
                    <p className="text-xs text-gray-500 font-medium line-clamp-3 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>

                  <div className="text-[11px] text-gray-450 font-bold space-y-1 bg-gray-50 p-2.5 rounded-xl border border-gray-150">
                    <div>Default Venue: {tmpl.venue || 'TBD'}</div>
                    <div>Default Capacity: {tmpl.capacity || 100} seats</div>
                    <div>Timing: {tmpl.startTime || '09:00'} - {tmpl.endTime || '17:00'}</div>
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      onClick={() => handleRemoveTemplate(tmpl.id, tmpl.title)}
                      title="Delete template"
                      className="p-2 border border-red-200 text-red-650 hover:bg-red-50 rounded-xl transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleOpenClone(tmpl)}
                      className="flex-grow flex items-center justify-center gap-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 rounded-xl text-xs shadow-xs transition"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Duplicate & Launch</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Past events conversion tab */
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-250 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 text-left font-bold text-gray-500 uppercase tracking-wider">Event Name</th>
                  <th className="px-6 py-3.5 text-left font-bold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3.5 text-left font-bold text-gray-500 uppercase tracking-wider">Venue</th>
                  <th className="px-6 py-3.5 text-right font-bold text-gray-500 uppercase tracking-wider">Convert</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allEvents.filter(ev => !ev.isTemplate).map((ev) => (
                  <tr key={ev.id} className="hover:bg-gray-55">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{ev.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-semibold">{ev.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-semibold">{ev.venue}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleSaveAsTemplate(ev.id, ev.title)}
                        className="inline-flex items-center gap-1 border border-primary-200 hover:bg-primary-50 text-primary-650 font-bold py-1.5 px-3 rounded-lg text-[10px] uppercase transition"
                      >
                        <span>Convert to Template</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal: Clone/Duplicate Template */}
        {isCloneOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-gray-250 shadow-2xl space-y-4">
              <h3 className="text-xl font-extrabold text-gray-900">Clone Event: {selectedTemplate?.title}</h3>
              
              <form onSubmit={handleCloneSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">New Event Title</label>
                  <input
                    type="text"
                    required
                    value={cloneTitle}
                    onChange={(e) => setCloneTitle(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">New Event Date</label>
                    <input
                      type="date"
                      required
                      value={cloneDate}
                      onChange={(e) => setCloneDate(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Registration Deadline</label>
                    <input
                      type="date"
                      required
                      value={cloneDeadline}
                      onChange={(e) => setCloneDeadline(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={cloneStart}
                      onChange={(e) => setCloneStart(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">End Time</label>
                    <input
                      type="time"
                      required
                      value={cloneEnd}
                      onChange={(e) => setCloneEnd(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Max capacity</label>
                    <input
                      type="number"
                      required
                      value={cloneCapacity}
                      onChange={(e) => setCloneCapacity(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">New Event Venue</label>
                  <input
                    type="text"
                    required
                    value={cloneVenue}
                    onChange={(e) => setCloneVenue(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-semibold"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCloneOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={cloning}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold shadow-sm transition"
                  >
                    {cloning ? 'Cloning...' : 'Launch Duplicate Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Create Template Blueprint */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-gray-250 shadow-2xl space-y-4">
              <h3 className="text-xl font-extrabold text-gray-900">Create Event Template Blueprint</h3>
              
              <form onSubmit={handleCreateTemplate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Template Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Annual Technical Code-A-Thon"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-primary-500"
                    >
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Default Capacity</label>
                    <input
                      type="number"
                      required
                      value={newCapacity}
                      onChange={(e) => setNewCapacity(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Default Venue Location</label>
                  <input
                    type="text"
                    required
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    placeholder="e.g. CSE Seminar Hall Block A"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase">Template Description</label>
                    <button
                      type="button"
                      onClick={handleGenerateAIDescription}
                      disabled={generatingAI}
                      className="text-[10px] font-black text-indigo-650 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-md hover:bg-indigo-100 transition flex items-center gap-0.5 focus:outline-none"
                    >
                      ✨ {generatingAI ? 'Generating...' : 'AI Generate Description'}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    required
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Write detailed event template scope information here..."
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-750 text-white rounded-xl text-sm font-bold shadow-sm transition"
                  >
                    {creating ? 'Saving...' : 'Save Blueprint Template'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default EventTemplates;
