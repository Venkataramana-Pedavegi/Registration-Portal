import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { KeyRound, Mail, ArrowLeft, ShieldCheck, Lock, Loader2, RefreshCw } from 'lucide-react';

const ForgotPassword = ({ setToast }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Step 1: Email, Step 2: OTP, Step 3: Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');

  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes expiration timer
  const [resendCooldown, setResendCooldown] = useState(0); // 60 seconds resend cooldown
  const timerRef = useRef(null);
  const cooldownRef = useRef(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(cooldownRef.current);
    };
  }, []);

  // Step 2 Countdown logic
  useEffect(() => {
    if (step === 2) {
      setCountdown(600);
      setResendCooldown(60);

      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setToast?.({ type: 'error', message: 'Your verification OTP has expired. Please request a new code.' });
            setStep(1);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      cooldownRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      clearInterval(cooldownRef.current);
    }
  }, [step]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    if (!email) {
      setToast?.({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setToast?.({ type: 'success', message: data.message || 'A 6-digit verification OTP code has been sent to your inbox!' });
      setStep(2);
    } catch (err) {
      console.error(err);
      setToast?.({ type: 'error', message: err.response?.data?.message || 'Password reset request failed. Please check connection and try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setToast?.({ type: 'success', message: data.message || 'A fresh verification OTP has been sent to your email.' });
      setCountdown(600);
      setResendCooldown(60);
      clearInterval(cooldownRef.current);
      cooldownRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
      setToast?.({ type: 'error', message: err.response?.data?.message || 'Failed to resend verification OTP.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setToast?.({ type: 'error', message: 'Verification OTP must be exactly 6 digits.' });
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      setToast?.({ type: 'success', message: 'OTP verified successfully! Please enter your new password.' });
      setToken(data.token);
      setStep(3);
    } catch (err) {
      console.error(err);
      setToast?.({ type: 'error', message: err.response?.data?.message || 'Invalid or expired OTP code.' });
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (pass) => {
    if (pass.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(pass)) return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(pass)) return 'Password must contain at least one lowercase letter.';
    if (!/\d/.test(pass)) return 'Password must contain at least one number.';
    if (!/[^A-Za-z0-9]/.test(pass)) return 'Password must contain at least one special character.';
    return null;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setToast?.({ type: 'error', message: 'Please fill in all password fields.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast?.({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setToast?.({ type: 'error', message: passwordError });
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setToast?.({ type: 'success', message: 'Password reset successfully! You can now log in.' });
      setTimeout(() => {
        navigate('/student-login');
      }, 1500);
    } catch (err) {
      console.error(err);
      setToast?.({ type: 'error', message: err.response?.data?.message || 'Failed to reset password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-gray-250 shadow-xl space-y-6">
        
        {/* Step Icons & Title */}
        <div className="text-center space-y-2">
          <div className="bg-primary-50 text-primary-600 p-3 rounded-full w-fit mx-auto border border-primary-100">
            {step === 1 && <KeyRound className="h-7 w-7" />}
            {step === 2 && <ShieldCheck className="h-7 w-7 text-indigo-650" />}
            {step === 3 && <Lock className="h-7 w-7 text-emerald-600" />}
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            {step === 1 && 'Reset Password'}
            {step === 2 && 'Verify Code'}
            {step === 3 && 'Set New Password'}
          </h2>
          <p className="text-xs text-gray-450 font-bold uppercase tracking-wider">
            {step === 1 && 'Step 1 of 3: Enter registered email'}
            {step === 2 && 'Step 2 of 3: Input verification code'}
            {step === 3 && 'Step 3 of 3: Save new password'}
          </p>
        </div>

        {/* STEP 1: Email Request */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
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
              className="w-full bg-primary-600 hover:bg-primary-750 text-white font-bold py-2.5 rounded-xl text-xs transition duration-150 shadow-xs flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending Request...</span>
                </>
              ) : (
                'Send Reset Instructions'
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="text-center p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1">
              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">Code Expiration Countdown</span>
              <div className="text-xl font-mono font-black text-indigo-950">{formatTime(countdown)}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">6-Digit Verification Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 tracking-widest font-mono text-center focus:ring-primary-500 focus:border-primary-500 shadow-xs text-lg font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition duration-150 shadow-xs flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                'Verify OTP Code'
              )}
            </button>

            <div className="flex gap-2 justify-between pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-gray-500 hover:text-gray-900 focus:outline-none"
              >
                Change Email
              </button>
              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={handleResendOtp}
                className={`text-xs font-bold transition flex items-center gap-1 ${
                  resendCooldown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-primary-650 hover:text-primary-750'
                }`}
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                <span>{resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Reset Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-primary-500 focus:border-primary-500 shadow-xs"
              />
              <p className="text-[10px] text-gray-400 font-semibold mt-1 leading-normal">
                Must contain at least 8 characters, an uppercase, a lowercase, a number, and a special character.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-primary-500 focus:border-primary-500 shadow-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition duration-150 shadow-xs flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Password...</span>
                </>
              ) : (
                'Save Password'
              )}
            </button>
          </form>
        )}

        {/* Back navigation link */}
        <div className="text-center pt-2.5 border-t border-gray-150">
          <Link to="/student-login" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-950 transition">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Student Login</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;
