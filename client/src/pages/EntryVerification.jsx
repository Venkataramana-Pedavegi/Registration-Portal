import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../services/api';
import Loader from '../components/Loader';
import { Camera, Shield, CheckCircle, XCircle, Send, VideoOff } from 'lucide-react';

const EntryVerification = () => {
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [manualInput, setManualInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState(false);
  
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

    try {
      let registrationId = null;

      // Check if input is a structured JSON payload
      try {
        const parsed = JSON.parse(inputValue);
        registrationId = parsed.registrationId;
      } catch (e) {
        // Fallback: If not JSON, check if it's a numeric string (Registration ID) or contains the /verify-pass/ URL
        const urlMatch = inputValue.match(/\/verify-pass\/(\d+)/);
        if (urlMatch) {
          registrationId = parseInt(urlMatch[1], 10);
        } else if (/^\d+$/.test(inputValue.trim())) {
          registrationId = parseInt(inputValue.trim(), 10);
        }
      }

      if (!registrationId) {
        throw new Error('QR code is not recognized');
      }

      // Hit entry verification endpoint
      const { data } = await api.post('/admin/entry/verify', { registrationId });
      setScanResult(data);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'Verification failed';
      setScanError(errMsg);
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
    <div className="flex-grow bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="bg-primary-50 text-primary-700 p-2.5 rounded-xl border border-primary-100 shadow-xs">
            <Shield className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
              Event Entry Verification
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Verify student registration codes securely at the venue entrance.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Side: Scanner Controls */}
          <div className="bg-white p-6 rounded-3xl border border-gray-250 shadow-xs space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                QR Code Scanner
              </h2>

              {/* QR Reader Window */}
              <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-square border border-gray-250 flex items-center justify-center">
                <div id="qr-reader" className="absolute inset-0 w-full h-full object-cover" />
                
                {!cameraActive && (
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
                    <VideoOff className="h-10 w-10 text-gray-500" />
                    <p className="text-xs text-gray-400 font-semibold">Camera scanner is currently stopped</p>
                  </div>
                )}
              </div>

              {cameraPermissionError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-start gap-2">
                  <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>Camera access is required for QR scanning.</strong> You can also enter the Registration ID manually.
                  </div>
                </div>
              )}
            </div>

            {/* Camera action buttons */}
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={startScanner}
                disabled={cameraActive}
                className="flex-grow py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 text-white rounded-2xl font-bold text-xs transition border border-primary-650 hover:shadow-md flex items-center justify-center gap-1.5"
              >
                <Camera className="h-4.5 w-4.5" />
                <span>Start Scanner</span>
              </button>
              <button
                type="button"
                onClick={stopScanner}
                disabled={!cameraActive}
                className="flex-grow py-3 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                <span>Stop Scanner</span>
              </button>
            </div>
          </div>

          {/* Right Side: Manual Verification & Feedback */}
          <div className="space-y-6">
            
            {/* Manual ID Input Card */}
            <div className="bg-white p-6 rounded-3xl border border-gray-250 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                Enter Registration ID
              </h2>
              
              <form onSubmit={handleManualSubmit} className="flex gap-3">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="e.g. 12"
                  className="flex-grow py-2.5 px-4 rounded-xl text-xs bg-gray-50 border border-gray-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                />
                <button
                  type="submit"
                  disabled={loading || !manualInput.trim()}
                  className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs"
                >
                  {loading ? <Loader size="small" /> : <Send className="h-4 w-4" />}
                  <span>Verify Entry</span>
                </button>
              </form>
            </div>

            {/* Results Feedback Area */}
            <div className="space-y-4">
              {loading && (
                <div className="bg-white p-12 rounded-3xl border border-gray-250 shadow-xs flex flex-col items-center justify-center space-y-3">
                  <Loader size="medium" />
                  <p className="text-xs text-gray-500 font-medium">Verifying registration details...</p>
                </div>
              )}

              {/* SUCCESS STATE */}
              {scanResult && scanResult.valid && (
                <div className="bg-white rounded-3xl border-2 border-green-500 shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom duration-250">
                  <div className="bg-green-500 text-white py-4 px-6 flex items-center gap-2 font-extrabold text-sm uppercase tracking-wider">
                    <CheckCircle className="h-5 w-5" />
                    <span>Entry Verified</span>
                  </div>
                  <div className="p-6 space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-y-3 text-gray-700">
                      <div>
                        <span className="block text-gray-400 font-bold uppercase text-[9px]">Student Name</span>
                        <strong className="text-gray-900 text-sm">{scanResult.student.name}</strong>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-bold uppercase text-[9px]">Roll Number</span>
                        <strong className="text-gray-900 text-sm">{scanResult.student.rollNumber}</strong>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-bold uppercase text-[9px]">Student ID</span>
                        <strong className="text-gray-900 font-semibold">{scanResult.student.id}</strong>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-bold uppercase text-[9px]">Event Name</span>
                        <strong className="text-gray-900 font-semibold">{scanResult.event.name}</strong>
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
                        <span className="block text-gray-400 font-bold uppercase text-[9px]">Status</span>
                        <span className="inline-block bg-green-50 border border-green-200 text-green-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          {scanResult.registration.status}
                        </span>
                      </div>
                    </div>
                    <div className="border-t border-gray-150 pt-4 text-center">
                      <p className="text-green-700 font-black text-sm tracking-wide">
                        "Student is eligible to enter this event."
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* INVALID STATE */}
              {scanError && (
                <div className="bg-white rounded-3xl border-2 border-red-500 shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom duration-250">
                  <div className="bg-red-500 text-white py-4 px-6 flex items-center gap-2 font-extrabold text-sm uppercase tracking-wider">
                    <XCircle className="h-5 w-5" />
                    <span>Invalid Entry</span>
                  </div>
                  <div className="p-6 text-center space-y-4">
                    <p className="text-sm font-extrabold text-red-700">
                      Reason: {scanError}
                    </p>
                    <p className="text-xs text-gray-500">
                      Please verify registration ID manually or request the student to check their registration status.
                    </p>
                  </div>
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
