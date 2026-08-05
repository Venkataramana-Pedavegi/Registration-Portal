import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { FileSpreadsheet, Play, Download, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

const BulkOperations = () => {
  const [activeTab, setActiveTab] = useState('register');
  const [inputText, setInputText] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [previewHeaders, setPreviewHeaders] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [running, setRunning] = useState(false);
  
  // SMTP Alert broadcast flag
  const [sendEmailNotification, setSendEmailNotification] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');

  // Results State
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [resultsSummary, setResultsSummary] = useState(null);

  useEffect(() => {
    if (activeTab === 'attendance' || activeTab === 'certificates') {
      const fetchEvents = async () => {
        try {
          setLoadingEvents(true);
          const { data } = await api.get('/events?isTemplate=all');
          setEvents(data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingEvents(false);
        }
      };
      fetchEvents();
    }
  }, [activeTab]);

  const parseCSV = (text) => {
    const lines = text.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };

    // Standard comma separation
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      const row = {};
      headers.forEach((header, index) => {
        row[header] = cols[index] || '';
      });
      rows.push(row);
    }
    return { headers, rows };
  };

  const handleTextChange = (e) => {
    const text = e.target.value;
    setInputText(text);
    const { headers, rows } = parseCSV(text);
    setPreviewHeaders(headers);
    setParsedData(rows);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      setInputText(text);
      const { headers, rows } = parseCSV(text);
      setPreviewHeaders(headers);
      setParsedData(rows);
    };
    reader.readAsText(file);
  };

  const handleExecute = async () => {
    setStatusMsg({ type: '', text: '' });
    setResultsSummary(null);

    if (parsedData.length === 0 && activeTab !== 'notify') {
      setStatusMsg({ type: 'error', text: 'No rows parsed. Please provide CSV data first.' });
      return;
    }

    setRunning(true);

    try {
      if (activeTab === 'register') {
        const { data } = await api.post('/admin/bulk/students', { students: parsedData });
        setResultsSummary(data);
        setStatusMsg({ type: 'success', text: `Processed ${parsedData.length} records.` });
      } else if (activeTab === 'attendance') {
        if (!selectedEventId) {
          setStatusMsg({ type: 'error', text: 'Please select an event.' });
          setRunning(false);
          return;
        }
        const formatted = parsedData.map((d) => ({
          rollNumber: d.rollNumber || d.RollNumber || '',
          status: d.status || d.Status || 'Present',
        }));
        const { data } = await api.post('/admin/bulk/attendance', {
          eventId: selectedEventId,
          attendanceRecords: formatted,
        });
        setResultsSummary(data);
        setStatusMsg({ type: 'success', text: `Attendance update completed.` });
      } else if (activeTab === 'certificates') {
        if (!selectedEventId) {
          setStatusMsg({ type: 'error', text: 'Please select an event.' });
          setRunning(false);
          return;
        }
        const rolls = parsedData.map((d) => d.rollNumber || d.RollNumber).filter(Boolean);
        const { data } = await api.post('/admin/bulk/certificates', {
          eventId: selectedEventId,
          rollNumbers: rolls,
        });
        setResultsSummary(data);
        setStatusMsg({ type: 'success', text: `Certificate issuing completed.` });
      } else if (activeTab === 'notify') {
        const rollsOrEmails = parsedData.map((d) => d.identifier || d.email || d.rollNumber).filter(Boolean);
        if (rollsOrEmails.length === 0) {
          setStatusMsg({ type: 'error', text: 'Please upload recipient list CSV with "identifier" or "email" header.' });
          setRunning(false);
          return;
        }
        await api.post('/admin/bulk/notifications', {
          recipients: rollsOrEmails,
          title: notificationTitle,
          message: notificationMessage,
          sendEmailNotification,
        });
        setStatusMsg({ type: 'success', text: `Successfully broadcast notifications to recipients.` });
        setNotificationTitle('');
        setNotificationMessage('');
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Bulk operation failed.' });
    } finally {
      setRunning(false);
    }
  };

  const getTemplateCSV = () => {
    if (activeTab === 'register') {
      return 'fullName,rollNumber,email,department,year\nJohn Doe,22A81A0501,johndoe@college.edu,CSE,3\nJane Smith,22A81A0402,janesmith@college.edu,ECE,3';
    }
    if (activeTab === 'attendance') {
      return 'rollNumber,status\n22A81A0501,Present\n22A81A0402,Absent';
    }
    if (activeTab === 'certificates') {
      return 'rollNumber\n22A81A0501\n22A81A0402';
    }
    if (activeTab === 'notify') {
      return 'identifier\n22A81A0501\njanesmith@college.edu';
    }
    return '';
  };

  const handleDownloadTemplate = () => {
    const csvContent = getTemplateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `svec_template_${activeTab}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-grow bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="h-8 w-8 text-primary-600" />
            Bulk Operations & Automation
          </h1>
          <p className="text-sm text-gray-500 mt-1">Import database updates, mark attendance logs, configure alerts, or dispatch notifications in batch.</p>
        </div>

        {/* Action Selection Tabs */}
        <div className="flex border-b border-gray-250 select-none pb-0.5 gap-2">
          {[
            { id: 'register', label: 'Bulk Student Signup' },
            { id: 'attendance', label: 'Bulk Attendance Update' },
            { id: 'certificates', label: 'Bulk Certificates Generation' },
            { id: 'notify', label: 'Bulk Notifications & Email' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setInputText('');
                setParsedData([]);
                setPreviewHeaders([]);
                setResultsSummary(null);
                setStatusMsg({ type: '', text: '' });
              }}
              className={`py-2 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-400 hover:text-gray-650'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form & Drag Drop Area */}
          <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">CSV Data Import</h3>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-bold"
              >
                <Download className="h-3.5 w-3.5" />
                Download Template CSV
              </button>
            </div>

            {/* Special filters depending on operation tab */}
            {(activeTab === 'attendance' || activeTab === 'certificates') && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase">Select Target Event</label>
                {loadingEvents ? (
                  <Loader size="small" />
                ) : (
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-primary-500"
                  >
                    <option value="">-- Choose Event --</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} ({new Date(ev.eventDate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Notification Text fields */}
            {activeTab === 'notify' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Notification Title / Email Subject</label>
                  <input
                    type="text"
                    required
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                    placeholder="e.g. Venue Change Notice"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Body Content</label>
                  <textarea
                    rows={4}
                    required
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    placeholder="Provide alert content description here..."
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmailNotification}
                    onChange={(e) => setSendEmailNotification(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>Dispatch SMTP Email alerts in addition to in-app notification logs</span>
                </label>
              </div>
            )}

            {/* File upload input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase">Upload CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>

            {/* Direct copy paste textbox */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase">Or Paste Raw CSV Data</label>
              <textarea
                rows={6}
                value={inputText}
                onChange={handleTextChange}
                placeholder="header1,header2,...\nvalue1,value2,..."
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-mono"
              />
            </div>

            <button
              onClick={handleExecute}
              disabled={running || (parsedData.length === 0 && activeTab !== 'notify')}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {running ? <Loader size="small" /> : <Play className="h-4.5 w-4.5" />}
              <span>Execute Bulk Action</span>
            </button>

            {/* Status alerts */}
            {statusMsg.text && (
              <div className={`p-4 rounded-xl border text-sm flex gap-3 ${
                statusMsg.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                {statusMsg.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
                <div>{statusMsg.text}</div>
              </div>
            )}
          </div>

          {/* Results Summary & Preview Data */}
          <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs flex flex-col justify-between space-y-4">
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Preview Parsed Records ({parsedData.length} row(s))</h3>

            {resultsSummary && (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl space-y-2 text-xs">
                <h4 className="font-extrabold text-gray-900">Execution Results</h4>
                {activeTab === 'register' && (
                  <div>
                    <p className="text-green-700 font-semibold">✓ Registered accounts successfully: {resultsSummary.createdCount}</p>
                    <p className="text-amber-700 font-semibold">⚠ Skipped rows: {resultsSummary.skippedCount}</p>
                    {resultsSummary.skipped && resultsSummary.skipped.length > 0 && (
                      <div className="mt-2 max-h-24 overflow-y-auto space-y-1">
                        {resultsSummary.skipped.map((skip, i) => (
                          <div key={i} className="text-[10px] text-red-650 font-medium">
                            - Row #{i+1} ({skip.student?.rollNumber}): {skip.reason}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'attendance' && (
                  <div>
                    <p className="text-green-700 font-semibold">✓ Attendance logged successfully: {resultsSummary.markedCount}</p>
                    <p className="text-amber-700 font-semibold">⚠ Skipped rows: {resultsSummary.skippedCount}</p>
                    {resultsSummary.skipped && resultsSummary.skipped.length > 0 && (
                      <div className="mt-2 max-h-24 overflow-y-auto space-y-1">
                        {resultsSummary.skipped.map((skip, i) => (
                          <div key={i} className="text-[10px] text-red-650 font-medium">
                            - Roll #{skip.record?.rollNumber}: {skip.reason}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'certificates' && (
                  <div>
                    <p className="text-green-700 font-semibold">✓ Certificates created successfully: {resultsSummary.issuedCount}</p>
                    <p className="text-amber-700 font-semibold">⚠ Skipped rows: {resultsSummary.skippedCount}</p>
                  </div>
                )}
              </div>
            )}

            {parsedData.length > 0 ? (
              <div className="border border-gray-200 rounded-xl overflow-hidden overflow-y-auto max-h-[350px] flex-grow">
                <table className="min-w-full divide-y divide-gray-250 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {previewHeaders.map((header) => (
                        <th key={header} className="px-4 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wider">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parsedData.slice(0, 100).map((row, index) => (
                      <tr key={index} className="hover:bg-gray-55">
                        {previewHeaders.map((header) => (
                          <td key={header} className="px-4 py-2 whitespace-nowrap text-gray-600 font-semibold">{row[header]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 100 && (
                  <div className="p-2 text-center text-[10px] text-gray-400 font-bold bg-gray-50 border-t border-gray-200">
                    Showing first 100 records only...
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300 flex-grow">
                <HelpCircle className="h-10 w-10 text-gray-300 mb-2" />
                <p className="text-xs text-gray-500 font-semibold">Provide raw CSV or drag a file to display records preview here.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default BulkOperations;
