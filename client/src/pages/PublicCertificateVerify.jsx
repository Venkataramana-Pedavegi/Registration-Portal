import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Award, CheckCircle, XCircle, Search, Calendar, User, Building, QrCode } from 'lucide-react';

const PublicCertificateVerify = () => {
  const { certificateId: urlCertId } = useParams();
  const [certIdInput, setCertIdInput] = useState(urlCertId || '');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (urlCertId) {
      verifyCertificate(urlCertId);
    }
  }, [urlCertId]);

  const verifyCertificate = async (idToVerify) => {
    if (!idToVerify || !idToVerify.trim()) return;
    setLoading(true);
    setError('');
    setVerificationResult(null);

    try {
      const res = await api.get(`/certificates/verify/${encodeURIComponent(idToVerify.trim())}`);
      setVerificationResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Certificate verification failed or invalid Certificate ID');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    verifyCertificate(certIdInput);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
            <Award className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Public Certificate Verification</h1>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Verify official participation certificates issued by the College Event Management System using your Certificate ID or QR code payload.
          </p>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearch} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-3">
          <div className="relative flex-grow">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Enter Certificate ID (e.g. CERT-12345)"
              value={certIdInput}
              onChange={(e) => setCertIdInput(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        {/* Verification Card Output */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4 text-red-700 animate-in fade-in duration-200">
            <XCircle className="w-6 h-6 flex-shrink-0 text-red-500" />
            <div>
              <h3 className="font-bold text-base">Invalid Certificate</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {verificationResult && verificationResult.isValid && (
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-8 space-y-6 animate-in fade-in duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full pointer-events-none" />

            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle className="w-8 h-8" />
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                  Verified Authentic Certificate
                </span>
              </div>
            </div>

            <div className="border-t border-b border-gray-100 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Student Name</label>
                  <p className="text-lg font-bold text-gray-900 flex items-center gap-2 mt-1">
                    <User className="w-4 h-4 text-indigo-600" /> {verificationResult.studentName}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Event Name</label>
                  <p className="text-lg font-bold text-gray-900 flex items-center gap-2 mt-1">
                    <Award className="w-4 h-4 text-indigo-600" /> {verificationResult.eventName}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Certificate ID</label>
                  <p className="text-base font-mono font-bold text-indigo-600 mt-1">
                    {verificationResult.certificateId}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Issue Date</label>
                  <p className="text-base font-medium text-gray-700 flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" /> {new Date(verificationResult.issueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 pt-2">
              <span>Organizer: {verificationResult.organizer || 'College Event Committee'}</span>
              <span>Official Institutional Record</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicCertificateVerify;
