import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { MailCheck, ShieldAlert, Loader, ArrowLeft } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState({ type: '', text: '' });

  const verifyToken = async () => {
    try {
      setLoading(true);
      // Call backend verification
      await api.get(`/student/verify/${token}`);
      setStatus({
        type: 'success',
        message: 'Email verified successfully.\nYour account has been activated.',
      });
      setTimeout(() => {
        navigate('/student-login');
      }, 3000); // Redirect to Student Login after 3 seconds
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || '';
      
      if (errMsg.toLowerCase().includes('already verified')) {
        setStatus({
          type: 'already_verified',
          message: 'This email has already been verified.',
        });
      } else if (errMsg.toLowerCase().includes('expired')) {
        setStatus({
          type: 'expired',
          message: 'Verification link expired.',
        });
      } else {
        setStatus({
          type: 'invalid',
          message: 'Invalid verification link.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
      setStatus({
        type: 'invalid',
        message: 'Invalid verification link.',
      });
    }
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResendLoading(true);
    setResendMessage({ type: '', text: '' });

    try {
      const { data } = await api.post('/student/resend-verification', { email: resendEmail });
      setResendMessage({ type: 'success', text: data.message });
      setResendEmail('');
    } catch (err) {
      console.error(err);
      setResendMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to resend verification email.',
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex-grow bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-gray-250 shadow-xl space-y-6">
        
        {loading ? (
          <div className="text-center py-10 space-y-4">
            <div className="flex justify-center">
              <Loader className="animate-spin h-10 w-10 text-primary-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Verifying Email Address</h2>
            <p className="text-xs text-gray-500">Checking verification token validity, please wait...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              {status.type === 'success' || status.type === 'already_verified' ? (
                <div className="bg-green-50 text-green-600 p-3 rounded-full w-fit mx-auto border border-green-100">
                  <MailCheck className="h-10 w-10" />
                </div>
              ) : (
                <div className="bg-red-50 text-red-600 p-3 rounded-full w-fit mx-auto border border-red-100">
                  <ShieldAlert className="h-10 w-10" />
                </div>
              )}
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {status.type === 'success' && 'Verification Successful'}
                {status.type === 'already_verified' && 'Already Verified'}
                {(status.type === 'expired' || status.type === 'invalid') && 'Verification Issue'}
              </h2>
              
              {status.type === 'success' && (
                <div className="bg-green-50 text-green-700 font-semibold p-4 rounded-xl border border-green-200 text-sm space-y-1">
                  <p className="font-bold">✓ Email verified successfully.</p>
                  <p>Your account has been activated.</p>
                </div>
              )}

              {status.type === 'already_verified' && (
                <div className="bg-green-50 text-green-700 font-semibold p-4 rounded-xl border border-green-200 text-sm">
                  <p className="font-bold">✓ This email has already been verified.</p>
                </div>
              )}

              {(status.type === 'expired' || status.type === 'invalid') && (
                <p className="text-sm text-red-700 font-semibold bg-red-50 p-3 rounded-xl border border-red-200">
                  {status.message}
                </p>
              )}
            </div>

            {(status.type === 'expired' || status.type === 'invalid') && (
              <div className="pt-4 border-t border-gray-150 space-y-4">
                <h3 className="text-sm font-bold text-gray-800">Request New Verification Link</h3>
                
                {resendMessage.text && (
                  <div className={`p-3 rounded-xl text-xs font-semibold ${resendMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {resendMessage.text}
                  </div>
                )}

                <form onSubmit={handleResend} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="student@college.edu"
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-primary-500 focus:border-primary-500 shadow-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resendLoading}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 rounded-xl text-xs transition duration-150 shadow-xs"
                  >
                    {resendLoading ? 'Resending Link...' : 'Resend Verification Link'}
                  </button>
                </form>
              </div>
            )}

            {status.type === 'already_verified' && (
              <div className="text-center pt-2">
                <Link to="/student-login" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition duration-150 shadow-xs inline-block text-center">
                  Go to Login
                </Link>
              </div>
            )}

            {status.type === 'success' && (
              <div className="text-center pt-2">
                <Link to="/student-login" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition duration-150 shadow-xs inline-block text-center">
                  Continue to Login
                </Link>
              </div>
            )}

            {(status.type === 'expired' || status.type === 'invalid') && (
              <div className="text-center pt-2 border-t border-gray-150">
                <Link to="/student-login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Login</span>
                </Link>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default VerifyEmail;
