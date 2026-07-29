import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import CertificateCard from '../components/CertificateCard';
import { Award } from 'lucide-react';

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/certificates');
        setCertificates(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load certificates catalog.');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
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
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Award className="h-8 w-8 text-primary-600" />
            My Certificates Portfolio
          </h1>
          <p className="text-sm text-gray-500 mt-1">Official PDF certificates issued for attended campus events.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center">
            {error}
          </div>
        )}

        {certificates.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-gray-500">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">No Certificates Available Yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              Certificates are automatically generated and issued once your attendance is marked Present by event administrators.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <CertificateCard key={cert.id || cert._id} certificate={cert} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Certificates;
