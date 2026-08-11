import React, { useState } from 'react';
import api from '../services/api';
import { Upload, FileText, CheckCircle2, AlertTriangle, X, Loader2, ArrowRight } from 'lucide-react';

const ImportAttendanceModal = ({ isOpen, onClose, events, selectedEventId, onImportSuccess }) => {
  const [targetEventId, setTargetEventId] = useState(selectedEventId || (events[0]?.id || events[0]?._id || ''));
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Simple CSV parser
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) return [];

    const hasHeader = lines[0].toLowerCase().includes('roll') || 
                      lines[0].toLowerCase().includes('registration') || 
                      lines[0].toLowerCase().includes('status');

    const startIndex = hasHeader ? 1 : 0;
    const records = [];

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length === 0 || !parts[0]) continue;

      let regId = null;
      let rollNum = null;
      let status = 'Present';

      // Infer columns
      if (parts.length >= 3) {
        regId = parts[0];
        rollNum = parts[1];
        status = parts[2];
      } else if (parts.length === 2) {
        if (/^\d+$/.test(parts[0])) {
          regId = parts[0];
          status = parts[1];
        } else {
          rollNum = parts[0];
          status = parts[1];
        }
      } else if (parts.length === 1) {
        if (/^\d+$/.test(parts[0])) {
          regId = parts[0];
        } else {
          rollNum = parts[0];
        }
      }

      records.push({
        registrationId: regId,
        rollNumber: rollNum,
        attendanceStatus: status,
      });
    }

    return records;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setError('');
    setPreviewResult(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText(event.target.result);
    };
    reader.onerror = () => {
      setError('Failed to read file content.');
    };
    reader.readAsText(file);
  };

  const handleValidate = async () => {
    setError('');
    setPreviewResult(null);
    setImportResult(null);

    if (!targetEventId) {
      setError('Please select an event for attendance import.');
      return;
    }

    const records = parseCSV(csvText);
    if (records.length === 0) {
      setError('No valid rows found in CSV data. Please check formatting.');
      return;
    }

    try {
      setValidating(true);
      const { data } = await api.post('/attendance/import', {
        eventId: Number(targetEventId),
        records,
        dryRun: true,
      });
      setPreviewResult(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to validate attendance import file.');
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    if (!previewResult || !previewResult.validRecords || previewResult.validRecords.length === 0) {
      setError('No valid records to import.');
      return;
    }

    try {
      setImporting(true);
      setError('');
      const records = parseCSV(csvText);
      const { data } = await api.post('/attendance/import', {
        eventId: Number(targetEventId),
        records,
        dryRun: false,
      });
      setImportResult(data);
      if (onImportSuccess) onImportSuccess(targetEventId);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to complete attendance import.');
    } finally {
      setImporting(false);
    }
  };

  const resetModal = () => {
    setCsvText('');
    setFileName('');
    setPreviewResult(null);
    setImportResult(null);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary-50 rounded-xl text-primary-600 border border-primary-100">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Import Attendance (Admin Only)</h3>
              <p className="text-xs text-gray-500">Bulk mark event attendance via CSV or Excel file upload</p>
            </div>
          </div>
          <button
            onClick={resetModal}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {importResult && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{importResult.message}</span>
              </div>
              <p className="text-xs text-emerald-700">
                Imported: {importResult.summary?.imported || 0} records | Skipped: {importResult.summary?.skipped || 0} records
              </p>
            </div>
          )}

          {/* Event Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
              1. Select Target Event
            </label>
            <select
              value={targetEventId}
              onChange={(e) => {
                setTargetEventId(e.target.value);
                setPreviewResult(null);
                setImportResult(null);
              }}
              className="w-full py-2.5 px-3.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 bg-white focus:ring-primary-500 focus:border-primary-500"
            >
              {events.map((ev) => (
                <option key={ev.id || ev._id} value={ev.id || ev._id}>
                  {ev.title} — ({ev.category}) — ID #{ev.id || ev._id}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload / CSV Input */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
              2. Upload CSV / Excel File or Paste Data
            </label>
            
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 transition">
                <FileText className="w-4 h-4 text-gray-600" />
                <span>Choose CSV File</span>
                <input type="file" accept=".csv, .txt, .tsv" onChange={handleFileUpload} className="hidden" />
              </label>
              {fileName && <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">{fileName}</span>}
            </div>

            <textarea
              rows={4}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                setPreviewResult(null);
                setImportResult(null);
              }}
              placeholder={`Format example:\nRegistration ID, Roll Number, Status\n101, 21A91A0501, Present\n102, 21A91A0502, Absent`}
              className="w-full p-3 font-mono text-xs border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Validation Preview Section */}
          {previewResult && (
            <div className="space-y-3 pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                  3. Validation Preview
                </span>
                <div className="flex gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                    {previewResult.summary?.validCount || 0} Valid
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                    {previewResult.summary?.invalidCount || 0} Skipped
                  </span>
                </div>
              </div>

              {/* Valid Rows Table */}
              {previewResult.validRecords?.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                      <tr>
                        <th className="p-2">Reg ID</th>
                        <th className="p-2">Roll No</th>
                        <th className="p-2">Student Name</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {previewResult.validRecords.map((r, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-2 font-mono">#{r.registrationId}</td>
                          <td className="p-2 font-mono">{r.rollNumber || 'N/A'}</td>
                          <td className="p-2 font-bold text-gray-900">{r.studentName}</td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${r.status === 'Present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Invalid / Error Rows List */}
              {previewResult.errorRecords?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-1 max-h-36 overflow-y-auto">
                  <span className="text-xs font-bold text-amber-900 block mb-1">Warnings / Errors ({previewResult.errorRecords.length}):</span>
                  {previewResult.errorRecords.map((err, idx) => (
                    <div key={idx} className="text-[11px] text-amber-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>Row {err.row}: {err.rollNumber || err.registrationId || 'Unknown'} — {err.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-150 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={resetModal}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-200 transition"
          >
            Close
          </button>

          {!previewResult ? (
            <button
              onClick={handleValidate}
              disabled={validating || !csvText.trim()}
              className="px-4 py-2 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>Validate File</span>
            </button>
          ) : (
            <button
              onClick={handleImport}
              disabled={importing || previewResult.validRecords?.length === 0}
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Confirm & Import ({previewResult.validRecords?.length || 0})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportAttendanceModal;
