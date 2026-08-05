import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { KeyRound, Mail, ArrowLeft, ShieldAlert } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage({ type: 'success', text: 'If an account is associated with this email, a 6-digit verification OTP has been sent.' });
      setStep(2); // Go to OTP verification step
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Password reset request failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit OTP code.' });
      return;
    }

    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      setMessage({ type: 'success', text: 'OTP verified successfully! Redirecting you to set new password...' });
      
      // Navigate to Reset Password page with the secure verification token
      setTimeout(() => {
        navigate(`/reset-password/${data.token}`);
      }, 1500);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Invalid or expired OTP.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-gray-250 shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="bg-primary-50 text-primary-600 p-3 rounded-full w-fit mx-auto border border-primary-100">
            <KeyRound className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Forgot Password</h2>
          <p className="text-xs text-gray-500">
            {step === 1 
              ? 'Enter your registered email address to receive verification OTP.' 
              : 'Enter the 6-digit OTP sent to your registered email address.'}
          </p>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl text-xs font-semibold ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@college.edu"
                  className="w-full pl-10 pr-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-primary-500 focus:border-primary-500 shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl text-xs transition duration-150 shadow-xs"
            >
              {loading ? 'Sending Request...' : 'Send Reset Instructions'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">6-Digit OTP Code</label>
              <div className="relative">
                <ShieldAlert className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full pl-10 pr-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 tracking-widest font-mono text-center focus:ring-primary-500 focus:border-primary-500 shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-650 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs transition duration-150 shadow-xs"
            >
              {loading ? 'Verifying OTP...' : 'Verify OTP Code'}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-center text-xs font-semibold text-gray-500 hover:text-gray-900 py-1"
            >
              Change Email / Back
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-gray-150">
          <Link to="/student-login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Login</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;
