import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import Pagination from '../components/Pagination';
import { ShieldCheck, Search, Globe, Clock, User, ArrowUpDown, Download, FileText, CheckCircle2, XCircle } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  
  // Filter States
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected Log for Details Modal
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 15,
        search,
        role: roleFilter,
        status: statusFilter,
        action: actionFilter,
        sort: sortBy,
        order: sortOrder,
      });

      const { data } = await api.get(`/auditlogs?${params.toString()}`);
      setLogs(data.auditLogs);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load security audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [roleFilter, statusFilter, actionFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
  };

  // CSV Export Action
  const handleExportCSV = () => {
    const token = localStorage.getItem('token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.open(`${API_URL}/export/audit-logs?token=${token}`, '_blank');
  };

  // PDF Export Action (Print mode)
  const handleExportPDF = () => {
    window.print();
  };

  const roles = ['Guest', 'Student', 'Admin'];
  const statuses = ['SUCCESS', 'FAILED'];
  const actions = [
    'LOGIN', 'LOGOUT', 'REGISTRATION', 'EVENT_CREATE', 'EVENT_UPDATE', 
    'EVENT_DELETE', 'ATTENDANCE_UPDATE', 'CERTIFICATE_GENERATE', 
    'VOLUNTEER_APPROVAL', 'VOLUNTEER_REJECTION', 'PROFILE_UPDATE', 
    'PASSWORD_CHANGE', 'GALLERY_UPLOAD', 'GALLERY_DELETE'
  ];

  return (
    <div className="flex-grow bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white">
      <div className="max-w-7xl mx-auto space-y-8 print:space-y-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 print:hidden">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-primary-600" />
              Security Audit Trail Logs
            </h1>
            <p className="text-sm text-gray-500 mt-1">Immutable security log trail tracking logins, actions, and administrative operations.</p>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition duration-150 shadow-xs"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition duration-150 shadow-xs"
            >
              <FileText className="h-4 w-4" />
              <span>Export PDF / Print</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs space-y-4 print:hidden">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search details or IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 bg-white focus:ring-primary-500 focus:border-primary-500 shadow-xs"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 bg-white focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Roles</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            {/* Action Filter */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 bg-white focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Actions</option>
              {actions.map(a => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 bg-white focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Search Trigger */}
            <button
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-2 rounded-xl text-xs transition duration-150"
            >
              Search Query
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center print:hidden">
            {error}
          </div>
        )}

        {/* Audit Logs Table */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-250 overflow-hidden print:border-none">
          {loading ? (
            <div className="py-16 print:hidden">
              <Loader size="large" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left text-xs text-gray-900">
                  <thead className="bg-gray-50 font-bold text-gray-700 uppercase print:bg-white print:border-b-2 print:border-gray-300">
                    <tr>
                      <th onClick={() => toggleSort('createdAt')} className="px-6 py-3.5 cursor-pointer hover:text-primary-700 select-none">
                        <div className="flex items-center gap-1">
                          <span>Timestamp</span>
                          <ArrowUpDown className="h-3 w-3 print:hidden" />
                        </div>
                      </th>
                      <th onClick={() => toggleSort('userRole')} className="px-6 py-3.5 cursor-pointer hover:text-primary-700 select-none">
                        <div className="flex items-center gap-1">
                          <span>User / Role</span>
                          <ArrowUpDown className="h-3 w-3 print:hidden" />
                        </div>
                      </th>
                      <th onClick={() => toggleSort('action')} className="px-6 py-3.5 cursor-pointer hover:text-primary-700 select-none">
                        <div className="flex items-center gap-1">
                          <span>Action</span>
                          <ArrowUpDown className="h-3 w-3 print:hidden" />
                        </div>
                      </th>
                      <th className="px-6 py-3.5">Details</th>
                      <th onClick={() => toggleSort('status')} className="px-6 py-3.5 cursor-pointer hover:text-primary-700 select-none">
                        <div className="flex items-center gap-1">
                          <span>Status</span>
                          <ArrowUpDown className="h-3 w-3 print:hidden" />
                        </div>
                      </th>
                      <th className="px-6 py-3.5 print:hidden">Audit IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 bg-white">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                          No security audit log entries matching your search filters.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr
                          key={log.id || log._id}
                          onClick={() => setSelectedLog(log)}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-3.5 font-mono text-gray-500 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap">
                            <span className={`font-bold px-2 py-0.5 rounded-full border text-[10px] ${
                              log.userRole === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {log.userRole || 'System'} #{log.userId || '0'}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 font-bold text-gray-950 whitespace-nowrap">
                            {log.action}
                          </td>
                          <td className="px-6 py-3.5 text-gray-600 max-w-xs truncate font-medium">
                            {log.details || 'N/A'}
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold border text-[10px] ${
                              log.status === 'SUCCESS' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {log.status === 'SUCCESS' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                              <span>{log.status}</span>
                            </span>
                          </td>
                          <td className="px-6 py-3.5 font-mono text-gray-500 whitespace-nowrap print:hidden">
                            {log.ipAddress}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="print:hidden">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={(p) => fetchLogs(p)}
                />
              </div>
            </>
          )}
        </div>

        {/* Row Detail modal overlay */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4 print:hidden">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-gray-200 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center pb-3 border-b border-gray-150">
                <h3 className="text-lg font-black text-gray-900">Audit Log Details</h3>
                <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">&times;</button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Security Action</span>
                  <span className="font-bold text-gray-900 text-sm">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Status</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full border ${
                    selectedLog.status === 'SUCCESS' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}>{selectedLog.status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Audited User</span>
                  <span className="font-semibold text-gray-900">{selectedLog.userRole} (ID #{selectedLog.userId || '0'})</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">IP Address</span>
                  <span className="font-mono text-gray-900">{selectedLog.ipAddress}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Operating System</span>
                  <span className="font-semibold text-gray-900">{selectedLog.os || 'Unknown OS'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Browser</span>
                  <span className="font-semibold text-gray-900">{selectedLog.browser || 'Unknown Browser'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Date & Time</span>
                  <span className="font-mono text-gray-900">{new Date(selectedLog.createdAt).toLocaleString()}</span>
                </div>
                <div className="col-span-2 bg-gray-50 p-4 border border-gray-200 rounded-xl">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Raw log details</span>
                  <pre className="font-mono text-[10px] text-gray-800 whitespace-pre-wrap break-all">{selectedLog.details || 'N/A'}</pre>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-gray-150">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs transition duration-150"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AuditLogs;
