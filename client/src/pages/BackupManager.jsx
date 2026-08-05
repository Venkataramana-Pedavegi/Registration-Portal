import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { Database, Plus, Download, RefreshCcw, FileJson, AlertTriangle } from 'lucide-react';

const BackupManager = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Selected file for recovery confirmation modal
  const [confirmRestoreFile, setConfirmRestoreFile] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/backups');
      setHistory(data);
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve backup files history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleCreateBackup = async () => {
    setSuccess('');
    setError('');
    setCreating(true);
    try {
      const { data } = await api.post('/admin/backups');
      setSuccess(`Database backup successfully saved: ${data.fileName}`);
      fetchHistory();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Backup generation failed.');
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadBackup = async (fileName) => {
    setSuccess('');
    setError('');
    try {
      const res = await api.get(`/admin/backups/${fileName}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccess(`Downloaded ${fileName} successfully.`);
    } catch (err) {
      console.error(err);
      setError('Failed to download backup file.');
    }
  };

  const handleRestoreSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setRestoring(true);

    try {
      let dataRes;
      if (uploadedFile) {
        // Form upload restore path
        const formData = new FormData();
        formData.append('file', uploadedFile);
        dataRes = await api.post('/admin/backups/restore', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // Historic file restore path
        dataRes = await api.post('/admin/backups/restore', { fileName: confirmRestoreFile });
      }

      setSuccess(dataRes.data.message || 'Database restored successfully.');
      setConfirmRestoreFile('');
      setUploadedFile(null);
      fetchHistory();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Database restoration failed.');
    } finally {
      setRestoring(false);
    }
  };

  const handleUploadFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      setConfirmRestoreFile('UPLOADED_FILE');
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-grow bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <Database className="h-8 w-8 text-primary-600" />
              Database Backup & Disaster Recovery
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage database manual backups, download archives, review backup history logs, and execute system recoveries.</p>
          </div>
          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow-sm transition"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>{creating ? 'Backing up...' : 'Create Backup File'}</span>
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

        {/* Info panel */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-xs text-amber-800">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="space-y-1">
            <span className="font-extrabold text-amber-900 uppercase">⚠ Critical Restoration Warnings</span>
            <p className="font-semibold leading-relaxed">
              Triggering database restoration will truncate/clear current database tables (Events, Registrations, Certificates, Badges, etc.) and repopulate them with records from the selected backup file. Perform manual backup before proceeding.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recovery Upload Zone */}
          <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs space-y-4 lg:col-span-1">
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Disaster Recovery Upload</h3>
            <p className="text-xs text-gray-400 font-semibold leading-relaxed">
              Upload a valid `.json` database backup archive directly from your local filesystem to initiate instant system recovery.
            </p>
            
            <div className="space-y-4 pt-2">
              <div className="border-2 border-dashed border-gray-300 hover:border-primary-500 rounded-2xl p-6 flex flex-col items-center justify-center bg-gray-50 text-center cursor-pointer transition">
                <FileJson className="h-10 w-10 text-gray-300 mb-2" />
                <label className="text-xs font-bold text-primary-650 hover:text-primary-850 cursor-pointer">
                  <span>Choose JSON Backup File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleUploadFileChange}
                    className="hidden"
                  />
                </label>
                {uploadedFile && (
                  <p className="text-xs font-semibold text-gray-700 mt-2 truncate w-full">
                    Selected: {uploadedFile.name}
                  </p>
                )}
              </div>

              {uploadedFile && (
                <button
                  onClick={() => setConfirmRestoreFile('UPLOADED_FILE')}
                  className="w-full bg-red-600 hover:bg-red-750 text-white font-bold py-2 rounded-xl text-sm transition"
                >
                  Restore From Uploaded File
                </button>
              )}
            </div>
          </div>

          {/* Backup History Table */}
          <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs space-y-4 lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Backup Archives History</h3>
            
            {loading ? (
              <div className="flex justify-center py-12"><Loader size="large" /></div>
            ) : history.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400 font-bold bg-gray-50 rounded-2xl border border-dashed">
                No backup records found.
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-250 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3.5 text-left font-bold text-gray-500 uppercase">Archive File Name</th>
                      <th className="px-6 py-3.5 text-left font-bold text-gray-500 uppercase">File Size</th>
                      <th className="px-6 py-3.5 text-left font-bold text-gray-500 uppercase">Created Date</th>
                      <th className="px-6 py-3.5 text-right font-bold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {history.map((backup) => (
                      <tr key={backup.fileName} className="hover:bg-gray-55">
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-gray-800">{backup.fileName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-semibold">{formatBytes(backup.size)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-semibold">{new Date(backup.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-3.5">
                            <button
                              onClick={() => handleDownloadBackup(backup.fileName)}
                              title="Download"
                              className="text-gray-500 hover:text-gray-800 transition"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setConfirmRestoreFile(backup.fileName)}
                              title="Restore Database"
                              className="text-red-650 hover:text-red-800 transition font-bold"
                            >
                              <RefreshCcw className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal: Confirm Database Restore */}
        {confirmRestoreFile && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-65 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-200 shadow-2xl text-center space-y-5">
              <div className="bg-red-50 text-red-600 p-3 rounded-full w-fit mx-auto border border-red-100">
                <AlertTriangle className="h-10 w-10 animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Confirm Restore Action</h3>
                <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                  You are about to restore the database from <strong className="font-mono text-red-650">{confirmRestoreFile === 'UPLOADED_FILE' ? uploadedFile?.name : confirmRestoreFile}</strong>.
                </p>
                <p className="text-xs text-red-650 font-bold bg-red-50 p-2.5 rounded-xl border border-red-100 leading-normal">
                  ⚠ WARNING: All current event details, student registrations, attendance logs, and issued certificates will be permanently erased.
                </p>
              </div>

              <form onSubmit={handleRestoreSubmit} className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmRestoreFile('');
                    setUploadedFile(null);
                  }}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={restoring}
                  className="flex-1 bg-red-600 hover:bg-red-750 text-white font-bold py-2.5 rounded-xl text-xs transition flex justify-center items-center gap-1.5 shadow-sm"
                >
                  {restoring ? <Loader size="small" /> : <RefreshCcw className="h-3.5 w-3.5" />}
                  <span>{restoring ? 'Restoring...' : 'Confirm Restore'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BackupManager;
