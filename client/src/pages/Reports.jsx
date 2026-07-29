import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import ExportButton from '../components/ExportButton';
import { FileSpreadsheet, Building, Users, Percent } from 'lucide-react';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/admin/reports');
        setReports(data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load event reports.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-50">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <div className="flex-grow bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="h-8 w-8 text-primary-600" />
              Event Performance & Audit Reports
            </h1>
            <p className="text-sm text-gray-500 mt-1">Detailed statistical summary of event capacities, occupancy rates, and attendance percentages.</p>
          </div>
          <ExportButton endpoint="/export/events" filename="events_performance_report.csv" label="Download Events CSV" />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Reports Table */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-250 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm text-gray-900">
              <thead className="bg-gray-50 text-xs font-bold text-gray-700 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Event Details</th>
                  <th className="px-6 py-4">Capacity & Seats</th>
                  <th className="px-6 py-4">Registration Rate</th>
                  <th className="px-6 py-4">Attendance Rate</th>
                  <th className="px-6 py-4">Cancellation Rate</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {reports.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-gray-950">{item.title}</div>
                      <div className="text-xs text-gray-500">{item.category} • {item.venue}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-gray-700">
                      <div>Capacity: {item.capacity}</div>
                      <div className="text-primary-600">Filled: {item.filledSeats} | Free: {item.availableSeats}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-gray-900">{item.registrationPct}%</span>
                        <div className="w-20 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-primary-600 h-full rounded-full" style={{ width: `${item.registrationPct}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-green-700">{item.attendancePct}%</span>
                        <div className="w-20 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-green-500 h-full rounded-full" style={{ width: `${item.attendancePct}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        {item.cancelledPct}% ({item.cancelledCount})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-bold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Reports;
