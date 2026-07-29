import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import QRCodeCard from '../components/QRCodeCard';
import { QrCode, ArrowLeft } from 'lucide-react';

const QRCodePage = () => {
  const { registrationId } = useParams();
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQR = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/qrcode/${registrationId}`);
        setQrData(data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to retrieve QR code.');
      } finally {
        setLoading(false);
      }
    };

    fetchQR();
  }, [registrationId]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-50">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <div className="flex-grow bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-6">
        
        <Link
          to="/my-registrations"
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          <span>Back to My Registrations</span>
        </Link>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center">
            {error}
          </div>
        ) : (
          qrData && (
            <QRCodeCard
              registrationId={qrData.registrationId}
              qrCodeUrl={qrData.qrCodeUrl}
              eventTitle={qrData.eventTitle}
              studentName={qrData.studentName}
              rollNumber={qrData.rollNumber}
            />
          )
        )}

      </div>
    </div>
  );
};

export default QRCodePage;
