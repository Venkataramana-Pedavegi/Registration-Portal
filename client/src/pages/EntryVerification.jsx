import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../services/api';
import Loader from '../components/Loader';
import { Camera, Shield, CheckCircle, XCircle, Send, VideoOff, Info, Clock, UserCheck, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

const EntryVerification = () => {
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [manualInput, setManualInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState(false);
  
  // Real local session state for stats & recent logs
  const [sessionLogs, setSessionLogs] = useState([]);
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    verified: 0,
    rejected: 0,
  });

  const qrCodeInstanceRef = useRef(null);

  // Stop scanning helper
  const stopScanner = async () => {
    if (qrCodeInstanceRef.current && qrCodeInstanceRef.current.isScanning) {
      try {
        await qrCodeInstanceRef.current.stop();
        setCameraActive(false);
      } catch (err) {
        console.error('Failed to stop camera scanner:', err);
      }
    }
  };

  // Start scanning helper
  const startScanner = async () => {
    setCameraPermissionError(false);
    setScanError('');
    setScanResult(null);

    // Create container instance if not already existing
    if (!qrCodeInstanceRef.current) {
      qrCodeInstanceRef.current = new Html5Qrcode('qr-reader');
    }

    try {
      setCameraActive(true);
      await qrCodeInstanceRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleVerification(decodedText);
          stopScanner(); // Stop scanning after successful decode
        },
        (error) => {
          // Suppress verbose scanner errors in console
        }
      );
    } catch (err) {
      console.error('Camera permissions or startup failed:', err);
      setCameraPermissionError(true);
      setCameraActive(false);
    }
  };

  // Cleanup scanner when page unmounts
  useEffect(() => {
    return () => {
      if (qrCodeInstanceRef.current && qrCodeInstanceRef.current.isScanning) {
        qrCodeInstanceRef.current.stop().catch((err) => console.error(err));
      }
    };
  }, []);

  // Handler to parse decoded QR payload or take manual ID
  const handleVerification = async (inputValue) => {
    setLoading(true);
    setScanResult(null);
    setScanError('');

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    try {
      let registrationId = null;

      if (typeof inputValue === 'object' && inputValue !== null) {
        registrationId = inputValue.registrationId || inputValue.id;
      } else if (inputValue) {
        const trimmed = String(inputValue).trim();
        // 1. Try parsing JSON payload encoded in student QR
        try {
          const parsed = JSON.parse(trimmed);
          registrationId = parsed.registrationId || parsed.id;
        } catch (e) {
          // 2. Try URL regex match /verify-pass/12 or /qrcode/12
          const urlMatch = trimmed.match(/\/(?:verify-pass|qrcode)\/(\d+)/);
          if (urlMatch) {
            registrationId = parseInt(urlMatch[1], 10);
          } else if (/^\d+$/.test(trimmed)) {
            // 3. Direct numeric ID
            registrationId = parseInt(trimmed, 10);
          }
        }
      }

      if (!registrationId) {
        throw new Error('Invalid or unreadable QR pass format');
      }

      // Hit entry verification endpoint
      const { data } = await api.post('/admin/entry/verify', { registrationId });
      
      const resultWithTimestamp = {
        ...data,
        verifiedAtTime: timeStr,
      };

      setScanResult(resultWithTimestamp);

      // Update session stats & logs
      setSessionStats(prev => ({
        total: prev.total + 1,
        verified: prev.verified + 1,
        rejected: prev.rejected,
      }));

      setSessionLogs(prev => [
        {
          id: Date.now(),
          registrationId: data.registration?.id || registrationId,
          studentName: data.student?.name || 'Student',
          rollNumber: data.student?.rollNumber || 'N/A',
          eventName: data.event?.name || 'Event',
          status: 'VERIFIED',
          time: timeStr,
        },
        ...prev.slice(0, 9)
      ]);

    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'Verification failed';
      setScanError(errMsg);

      // Update session stats & logs for failure
      setSessionStats(prev => ({
        total: prev.total + 1,
        verified: prev.verified,
        rejected: prev.rejected + 1,
      }));

      setSessionLogs(prev => [
        {
          id: Date.now(),
          registrationId: inputValue || 'Unknown',
          studentName: 'Unknown',
          rollNumber: 'N/A',
          eventName: 'Gate Pass Check',
          status: 'REJECTED',
          reason: errMsg,
          time: timeStr,
        },
        ...prev.slice(0, 9)
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleVerification(manualInput);
    setManualInput('');
  };

  return (
    <div className="flex-grow bg-gray-50/50 py-6 sm:py-8 px-3 sm:px-6 lg:px-8 w-full max-w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 w-full min-w-0">
        
        {/* Header Banner */}
        <div className="bg-white p-5 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 w-full min-w-0">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="bg-primary-50 text-primary-600 p-3 sm:p-3.5 rounded-2xl border border-primary-100/80 shadow-xs shrink-0">
              <Shield className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight uppercase truncate">
                  Event Entry Verification
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live Venue Access
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 font-medium truncate">
                Verify student event entry passes securely at the venue entrance.
              </p>
            </div>
          </div>

          {/* Session Statistics Bar */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto min-w-0">
            <div className="flex-1 md:flex-initial bg-gray-50 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-gray-200/60 text-center min-w-0">
              <span className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-wider truncate">Session Scans</span>
              <strong className="text-base sm:text-lg font-black text-gray-900">{sessionStats.total}</strong>
            </div>
            <div className="flex-1 md:flex-initial bg-green-50/60 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-green-200/60 text-center min-w-0">
              <span className="block text-[9px] font-extrabold text-green-600 uppercase tracking-wider truncate">Verified</span>
              <strong className="text-base sm:text-lg font-black text-green-700">{sessionStats.verified}</strong>
            </div>
            <div className="flex-1 md:flex-initial bg-red-50/60 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-red-200/60 text-center min-w-0">
              <span className="block text-[9px] font-extrabold text-red-600 uppercase tracking-wider truncate">Rejected</span>
              <strong className="text-base sm:text-lg font-black text-red-700">{sessionStats.rejected}</strong>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 lg:gap-8 w-full min-w-0">
          
          {/* LEFT COLUMN: QR Pass Scanner & Guide */}
          <div className="min-w-0 space-y-6 w-full">
            
            {/* QR Pass Scanner Card */}
            <div className="bg-white p-5 sm:p-7 rounded-3xl border border-gray-200/80 shadow-xs space-y-6 flex flex-col justify-between w-full min-w-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Camera className="h-4.5 w-4.5 text-primary-600" />
                    <span>QR Pass Scanner</span>
                  </h2>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
                    Primary
                  </span>
                </div>

                {/* Camera View Box */}
                <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-square border border-gray-300 shadow-inner flex items-center justify-center">
                  <div id="qr-reader" className="absolute inset-0 w-full h-full object-cover" />
                  
                  {!cameraActive && (
                    <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
                      <div className="bg-slate-900 p-4 rounded-full border border-slate-800 text-slate-400">
                        <VideoOff className="h-10 w-10" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-200">Camera is stopped</p>
                        <p className="text-[11px] text-slate-400 max-w-xs">
                          Click "Start Scanner" below to begin scanning student entry QR code
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {cameraPermissionError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs flex items-start gap-2.5">
                    <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Camera access required:</strong> Please grant camera permission in your browser or use the manual fallback option.
                    </div>
                  </div>
                )}
              </div>

              {/* Action Control Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={startScanner}
                  disabled={cameraActive}
                  className="flex-grow py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 text-white rounded-2xl font-bold text-xs transition border border-primary-650 shadow-xs hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera className="h-4.5 w-4.5" />
                  <span>Start Scanner</span>
                </button>
                <button
                  type="button"
                  onClick={stopScanner}
                  disabled={!cameraActive}
                  className="flex-grow py-3.5 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Stop Scanner</span>
                </button>
              </div>
            </div>

            {/* How to Verify Guide Card */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <Info className="h-4 w-4 text-primary-600" />
                <span>How to Verify Student Pass</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-gray-600 font-medium">
                <div className="flex items-start gap-2.5 bg-gray-50 p-3 rounded-2xl border border-gray-200/60">
                  <span className="bg-primary-100 text-primary-700 font-bold h-5 w-5 rounded-full flex items-center justify-center text-[10px] shrink-0">1</span>
                  <span>Click <strong>Start Scanner</strong> to enable camera</span>
                </div>
                <div className="flex items-start gap-2.5 bg-gray-50 p-3 rounded-2xl border border-gray-200/60">
                  <span className="bg-primary-100 text-primary-700 font-bold h-5 w-5 rounded-full flex items-center justify-center text-[10px] shrink-0">2</span>
                  <span>Allow camera access when prompted</span>
                </div>
                <div className="flex items-start gap-2.5 bg-gray-50 p-3 rounded-2xl border border-gray-200/60">
                  <span className="bg-primary-100 text-primary-700 font-bold h-5 w-5 rounded-full flex items-center justify-center text-[10px] shrink-0">3</span>
                  <span>Scan student's Event Entry QR code</span>
                </div>
                <div className="flex items-start gap-2.5 bg-gray-50 p-3 rounded-2xl border border-gray-200/60">
                  <span className="bg-primary-100 text-primary-700 font-bold h-5 w-5 rounded-full flex items-center justify-center text-[10px] shrink-0">4</span>
                  <span>View verification result & student details</span>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Manual Verification, Result Card & Session Logs */}
          <div className="min-w-0 space-y-6 w-full">
            
            {/* Manual Verification Fallback Card */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Manual Verification
                </h2>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                  Fallback
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                Use this option only when the camera is unavailable.
              </p>
              
              <form onSubmit={handleManualSubmit} className="flex gap-2.5">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Enter Registration ID e.g. 12"
                  className="flex-grow py-3 px-4 rounded-2xl text-xs bg-gray-50 border border-gray-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                />
                <button
                  type="submit"
                  disabled={loading || !manualInput.trim()}
                  className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-2xl text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  {loading ? <Loader size="small" /> : <Send className="h-4 w-4" />}
                  <span>Verify</span>
                </button>
              </form>
            </div>

            {/* Verification Result Card */}
            <div className="space-y-4">
              {loading && (
                <div className="bg-white p-10 rounded-3xl border border-gray-200 shadow-xs flex flex-col items-center justify-center space-y-3">
                  <Loader size="medium" />
                  <p className="text-xs text-gray-500 font-medium">Verifying registration pass details...</p>
                </div>
              )}

              {/* SUCCESS STATE CARD */}
              {scanResult && scanResult.valid && (
                <div className="bg-white rounded-3xl border-2 border-green-500 shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom duration-250">
                  <div className="bg-green-500 text-white py-3.5 px-6 flex items-center justify-between font-extrabold text-sm uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      <span>Entry Verified</span>
                    </div>
                    {scanResult.verifiedAtTime && (
                      <span className="text-[10px] font-bold bg-green-600/60 px-2 py-0.5 rounded-full flex items-center gap-1 text-white">
                        <Clock className="h-3 w-3" /> {scanResult.verifiedAtTime}
                      </span>
                    )}
                  </div>
                  <div className="p-6 space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-y-3.5 text-gray-700">
                      <div>
                        <span className="block text-gray-400 font-bold uppercase text-[9px]">Student Name</span>
                        <strong className="text-gray-900 text-sm font-black">{scanResult.student.name}</strong>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-bold uppercase text-[9px]">Roll Number</span>
                        <strong className="text-gray-900 text-sm font-black">{scanResult.student.rollNumber}</strong>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-bold uppercase text-[9px]">Student ID</span>
                        <strong className="text-gray-900 font-bold">#{scanResult.student.id}</strong>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-bold uppercase text-[9px]">Event Name</span>
                        <strong className="text-gray-900 font-bold">{scanResult.event.name}</strong>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-bold uppercase text-[9px]">Event ID</span>
                        <strong className="text-gray-900 font-semibold">#{scanResult.event.id}</strong>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-bold uppercase text-[9px]">Registration ID</span>
                        <strong className="text-gray-900 font-semibold">#{scanResult.registration.id}</strong>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-bold uppercase text-[9px]">Registration Status</span>
                        <span className="inline-block bg-green-50 border border-green-200 text-green-700 font-extrabold px-2 py-0.5 rounded-full text-[10px]">
                          {scanResult.registration.status}
                        </span>
                      </div>
                    </div>
                    <div className="border-t border-gray-150 pt-4 text-center">
                      <p className="text-green-700 font-black text-xs tracking-wide uppercase">
                        ✅ ENTRY VERIFIED: Student is eligible to enter this event.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* INVALID / REJECTED STATE CARD */}
              {scanError && (
                <div className="bg-white rounded-3xl border-2 border-red-500 shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom duration-250">
                  <div className="bg-red-500 text-white py-3.5 px-6 flex items-center justify-between font-extrabold text-sm uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5" />
                      <span>Entry Rejected</span>
                    </div>
                  </div>
                  <div className="p-6 text-center space-y-3">
                    <p className="text-sm font-extrabold text-red-700">
                      Reason: {scanError}
                    </p>
                    <p className="text-xs text-gray-500 font-semibold">
                      ❌ ENTRY REJECTED: Student pass is invalid, cancelled, or unrecorded.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Verifications History Section */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>Recent Verifications</span>
                </h3>
                {sessionLogs.length > 0 && (
                  <span className="text-[10px] font-bold text-gray-400">
                    {sessionLogs.length} logged
                  </span>
                )}
              </div>

              {sessionLogs.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-gray-200 rounded-2xl text-gray-400 text-xs">
                  No recent verification records in this session.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {sessionLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-200/60 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="font-bold text-gray-900">{log.studentName} ({log.rollNumber})</div>
                        <div className="text-[10px] text-gray-500">{log.eventName} • Reg #{log.registrationId}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`inline-block font-extrabold text-[9px] px-2 py-0.5 rounded-full ${
                          log.status === 'VERIFIED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status}
                        </span>
                        <div className="text-[9px] text-gray-400 font-semibold mt-0.5">{log.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default EntryVerification;

