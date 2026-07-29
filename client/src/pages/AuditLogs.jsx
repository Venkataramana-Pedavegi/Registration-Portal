import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import Pagination from '../components/Pagination';
import { ShieldCheck, Search, Globe, Clock, User } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async (page = 1, searchQuery = '') => {
    try {
      setLoading(true);
      const { data } = await api.get(`/auditlogs?page=${page}&limit=15&search=${encodeURIComponent(searchQuery)}`);
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
    fetchLogs(1, search);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1, search);
  };

  return (
    <div className="flex-grow bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-primary-600" />
              Security Audit Trail Logs
            </h1>
            <p className="text-sm text-gray-500 mt-1">Immutable security log trail tracking admin logins, CRUD operations, QR scans, and exports.</p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search action or IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3.5 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 bg-white focus:ring-primary-500 focus:border-primary-500 shadow-xs"
              />
            </div>
            <button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition duration-150"
            >
              Filter
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Audit Logs Table */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-250 overflow-hidden">
          {loading ? (
            <div className="py-16">
              <Loader size="large" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left text-xs text-gray-900">
                  <thead className="bg-gray-50 font-bold text-gray-700 uppercase">
                    <tr>
                      <th className="px-6 py-3.5">Timestamp</th>
                      <th className="px-6 py-3.5">User Role / ID</th>
                      <th className="px-6 py-3.5">Security Action</th>
                      <th className="px-6 py-3.5">Details</th>
                      <th className="px-6 py-3.5">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 bg-white">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">
                          No security audit log entries matching your search.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id || log._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3.5 font-mono text-gray-500 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap">
                            <span className={`font-bold px-2 py-0.5 rounded-full border ${
                              log.userRole === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {log.userRole || 'System'} #{log.userId || '0'}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 font-bold text-gray-950 whitespace-nowrap">
                            {log.action}
                          </td>
                          <td className="px-6 py-3.5 text-gray-650 font-mono text-[11px] max-w-xs truncate">
                            {log.details || 'N/A'}
                          </td>
                          <td className="px-6 py-3.5 font-mono text-gray-500 whitespace-nowrap">
                            {log.ipAddress}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(p) => fetchLogs(p, search)}
              />
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default AuditLogs;
