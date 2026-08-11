import React, { useEffect, useState } from 'react';
import api from '../services/api';
import QRCodeCard from './QRCodeCard';
import Loader from './Loader';
import { X, QrCode } from 'lucide-react';

const QRCodeModal = ({ isOpen, onClose, registrationId }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && registrationId) {
      const fetchQR = async () => {
        try {
          setLoading(true);
          setError('');
          const { data } = await api.get(`/qrcode/${registrationId}`);
          setQrData(data);
        } catch (err) {
          console.error(err);
          setError(err.response?.data?.message || 'Failed to retrieve entry QR code.');
        } finally {
          setLoading(false);
        }
      };

      fetchQR();
    }
  }, [isOpen, registrationId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            <QrCode className="h-5 w-5 text-primary-200" />
            <span>Event Entry QR Code Pass</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader size="medium" />
              <p className="text-xs text-gray-500 font-medium">Generating official entry pass...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-center text-xs">
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
                eventDate={qrData.eventDate}
                venue={qrData.venue}
                status={qrData.status}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
