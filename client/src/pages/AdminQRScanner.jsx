import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../services/api';
import Loader from '../components/Loader';
import { Camera, RefreshCw, CheckCircle, XCircle, User, Calendar, Award, ShieldAlert } from 'lucide-react';

const AdminQRScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoMark, setAutoMark] = useState(true);
  const [manualInput, setManualInput] = useState('');
  
  const [attendanceSuccess, setAttendanceSuccess] = useState('');
  const [attendanceError, setAttendanceError] = useState('');
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  useEffect(() => {
    // Initialize html5-qrcode scanner
    const scanner = new Html5QrcodeScanner('qr-reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    });

    scanner.render(
      (decodedText) => {
        handleScanSuccess(decodedText);
      },
      (error) => {
        // Suppress verbose scanner errors in UI
      }
    );

    return () => {
      scanner.clear().catch((err) => console.warn('Scanner cleanup warning:', err));
    };
  }, []);

  const handleScanSuccess = async (qrData) => {
    setScanError('');
    setAttendanceSuccess('');
    setAttendanceError('');
    setLoading(true);
    try {
      // 1. Resolve registration ID from scan string
      let registrationId = '';
      const urlMatch = qrData.match(/\/verify-pass\/(\d+)/);
      if (urlMatch) {
        registrationId = urlMatch[1];
      } else {
        try {
          const parsed = JSON.parse(qrData);
          registrationId = parsed.registrationId;
        } catch {
          if (/^\d+$/.test(qrData.trim())) {
            registrationId = qrData.trim();
          }
        }
      }

      if (!registrationId) {
        throw new Error('Unable to extract Registration ID from QR data.');
      }

      // 2. Fetch details from backend public verify endpoint
      const { data } = await api.get(`/qrcode/verify/${registrationId}`);
      setScanResult(data);

      // 3. Optionally mark attendance automatically
      if (autoMark && data.isValid && data.attendanceStatus !== 'Present') {
        await triggerAttendance(registrationId);
      }
    } catch (err) {
      console.error(err);
      setScanResult(null);
      setScanError(err.response?.data?.message || err.message || 'Failed to read QR Code details.');
    } finally {
      setLoading(false);
    }
  };

  const triggerAttendance = async (regId) => {
    setAttendanceLoading(true);
    setAttendanceSuccess('');
    setAttendanceError('');
    try {
      const { data } = await api.post('/qrcode/scan', { registrationId: regId });
      setAttendanceSuccess(data.message || 'Attendance marked Present successfully!');
      
      // Update local state to reflect marked attendance
      setScanResult((prev) => prev ? { ...prev, attendanceStatus: 'Present', markedAt: new Date() } : null);
    } catch (err) {
      console.error(err);
      setAttendanceError(err.response?.data?.message || 'Failed to record attendance.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleScanSuccess(manualInput.trim());
    setManualInput('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Side: Scanner Controls */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-150 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
              <Camera className="text-purple-600 h-5 w-5" />
              QR Code Scanner
            </h2>
            <div className="flex items-center gap-2">
              <input
                id="auto-mark-check"
                type="checkbox"
                checked={autoMark}
                onChange={(e) => setAutoMark(e.target.checked)}
                className="h-4 w-4 text-purple-650 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="auto-mark-check" className="text-xs font-bold text-gray-500 cursor-pointer">
                Auto-Mark Attendance
              </label>
            </div>
          </div>

          {/* Scanner view holder */}
          <div className="overflow-hidden rounded-xl bg-slate-100 border-2 border-dashed border-gray-350 p-2">
            <div id="qr-reader" style={{ width: '100%' }}></div>
          </div>

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">
              Manual Pass Code / Link Entry
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Paste pass URL or enter Pass ID..."
                className="flex-grow px-4 py-2 border rounded-xl text-sm focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition"
              >
                Scan Code
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Scan & Verification Details */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-150 flex flex-col justify-between">
          <div className="space-y-6">
            <h2 className="text-lg font-black text-gray-800 border-b pb-4">
              Pass Details & Verification
            </h2>

            {loading && (
              <div className="py-12 flex justify-center">
                <Loader size="medium" />
              </div>
            )}

            {scanError && (
              <div className="p-4 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-xs font-semibold flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
                <span>{scanError}</span>
              </div>
            )}

            {!loading && !scanResult && !scanError && (
              <div className="py-16 text-center text-gray-400 space-y-2">
                <RefreshCw className="h-10 w-10 mx-auto text-gray-300 animate-spin" style={{ animationDuration: '3s' }} />
                <p className="text-xs font-bold uppercase tracking-wider">Awaiting Pass Scan</p>
                <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                  Hold a student's QR code up to the camera or type/paste the pass ID to view details.
                </p>
              </div>
            )}

            {scanResult && !loading && (
              <div className="space-y-5">
                
                {/* Validity Header */}
                <div className={`p-4 rounded-xl flex items-center gap-3 border ${
                  scanResult.isValid 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {scanResult.isValid ? (
                    <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <div className="text-xs font-black uppercase">
                      {scanResult.isValid ? 'Valid QR Code Pass' : 'Invalid QR Code Pass'}
                    </div>
                    <div className="text-[10px] font-semibold opacity-90">{scanResult.message}</div>
                  </div>
                </div>

                {/* Details Table */}
                <div className="space-y-3">
                  
                  <div className="flex justify-between items-center text-xs text-gray-400 font-bold border-b pb-2">
                    <span>PASS ID: SVEC-{String(scanResult.passId).padStart(4, '0')}</span>
                    <span>REG STATUS: <span className={scanResult.registrationStatus === 'Registered' ? 'text-teal-600' : 'text-rose-600'}>{scanResult.registrationStatus}</span></span>
                  </div>

                  {/* Student Details */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-purple-500" />
                      Student Details
                    </h4>
                    <div className="bg-slate-50 p-3.5 rounded-xl border text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-gray-400 font-bold uppercase text-[9px]">Student Name:</span>
                        <span className="font-extrabold text-gray-800">{scanResult.studentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 font-bold uppercase text-[9px]">Roll Number:</span>
                        <span className="font-bold text-gray-700">{scanResult.rollNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 font-bold uppercase text-[9px]">Email:</span>
                        <span className="font-semibold text-gray-600">{scanResult.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 font-bold uppercase text-[9px]">Department:</span>
                        <span className="font-bold text-gray-700">{scanResult.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-purple-500" />
                      Event Info
                    </h4>
                    <div className="bg-purple-50/30 p-3.5 rounded-xl border border-purple-100 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-purple-400 font-bold uppercase text-[9px]">Event Name:</span>
                        <span className="font-extrabold text-gray-800">{scanResult.eventName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-400 font-bold uppercase text-[9px]">Event Date:</span>
                        <span className="font-semibold text-gray-700">{new Date(scanResult.eventDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-400 font-bold uppercase text-[9px]">Venue:</span>
                        <span className="font-semibold text-gray-700">{scanResult.eventVenue}</span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Award className="h-4.5 w-4.5 text-amber-500" />
                      <div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase">Attendance Status</div>
                        <div className="text-[10px] text-gray-500">
                          {scanResult.attendanceStatus === 'Present' && scanResult.markedAt
                            ? `Scanned at ${new Date(scanResult.markedAt).toLocaleTimeString()}`
                            : 'Absent'}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      scanResult.attendanceStatus === 'Present' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {scanResult.attendanceStatus}
                    </span>
                  </div>

                </div>

              </div>
            )}
          </div>

          {/* Action Footer */}
          {scanResult && !loading && (
            <div className="pt-6 border-t space-y-3">
              {attendanceSuccess && (
                <div className="p-3 bg-green-50 text-green-800 rounded-xl border border-green-200 text-xs font-semibold">
                  {attendanceSuccess}
                </div>
              )}
              {attendanceError && (
                <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs font-semibold">
                  {attendanceError}
                </div>
              )}

              {scanResult.isValid && scanResult.attendanceStatus !== 'Present' && (
                <button
                  onClick={() => triggerAttendance(scanResult.passId)}
                  disabled={attendanceLoading}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-750 text-white rounded-xl font-bold text-sm transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  {attendanceLoading ? <Loader size="small" /> : 'Confirm & Mark Attendance'}
                </button>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default AdminQRScanner;
