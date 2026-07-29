import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import RegistrationBadge from '../components/RegistrationBadge';
import { Calendar, ArrowLeft, Building } from 'lucide-react';

const RegistrationHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/registrations/my-events');
        setHistory(data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load signup history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
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
      <div className="max-w-4xl mx-auto space-y-6">
        
        <Link
          to="/my-registrations"
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          <span>Back to active list</span>
        </Link>

        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Registration History</h1>
          <p className="text-sm text-gray-500 mt-1">Review all your previous signups, cancellation dates, and completed events.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center">
            {error}
          </div>
        )}

        {history.length === 0 ? (
          <EmptyState
            title="No History Found"
            message="No registration records exist in your account. Sign up for events on the explorer panel first."
          />
        ) : (
          <div className="bg-white rounded-xl shadow-xs border border-gray-250 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm text-gray-900">
                <thead className="bg-gray-50 text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Event Title</th>
                    <th className="px-6 py-4">Organizer</th>
                    <th className="px-6 py-4">Date Registered</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {history.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-950">{reg.Event?.title || 'Unknown Event'}</div>
                        <div className="text-xs text-gray-500">
                          {reg.Event ? new Date(reg.Event.eventDate).toLocaleDateString() : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-650">
                        <div className="flex items-center gap-1">
                          <Building className="h-3.5 w-3.5 text-gray-400" />
                          <span>{reg.Event?.organizer || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-650">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          <span>{new Date(reg.registrationDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RegistrationBadge status={reg.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold">
                        {reg.Event && (
                          <Link to={`/events/${reg.Event.id}`} className="text-primary-600 hover:text-primary-700">
                            Details
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationHistory;
