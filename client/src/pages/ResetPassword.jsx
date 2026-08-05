import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Lock, ShieldCheck, ShieldAlert, ArrowLeft } from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Calculate password strength score
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-gray-200' };
    
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/\W/.test(pass)) score += 1;

    if (pass.length < 8) {
      return { score: 1, label: 'Too Short (Min 8 chars)', color: 'bg-red-500', width: 'w-1/5' };
    }
    
    switch (score) {
      case 5:
        return { score: 5, label: 'Strong (Enterprise Grade)', color: 'bg-green-600', width: 'w-full' };
      case 4:
        return { score: 4, label: 'Good', color: 'bg-green-400', width: 'w-4/5' };
      case 3:
      case 2:
        return { score: 2, label: 'Medium (Include Symbols & Caps)', color: 'bg-yellow-400', width: 'w-2/5' };
      default:
        return { score: 1, label: 'Weak', color: 'bg-red-400', width: 'w-1/5' };
    }
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    if (strength.score < 5) {
      setMessage({ type: 'error', text: 'Password does not meet complexity rules. It must contain at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character.' });
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/auth/reset-password', { token, newPassword });
      setMessage({ type: 'success', text: data.message });
      setTimeout(() => {
        navigate('/student-login');
      }, 2000);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Password reset failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-gray-250 shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="bg-purple-50 text-purple-600 p-3 rounded-full w-fit mx-auto border border-purple-100">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Reset Account Password</h2>
          <p className="text-xs text-gray-500">Choose a new password adhering to the college security policies.</p>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl text-xs font-semibold ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-primary-500 focus:border-primary-500 shadow-xs"
            />
            
            {/* Live Password Strength Meter */}
            {newPassword && (
              <div className="mt-2.5 space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-gray-400">Password Strength:</span>
                  <span className={strength.score === 5 ? 'text-green-600' : 'text-gray-500'}>{strength.label}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${strength.color} ${strength.width} transition-all duration-355`} />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-primary-500 focus:border-primary-500 shadow-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-650 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs transition duration-150 shadow-xs"
          >
            {loading ? 'Resetting Password...' : 'Save New Password'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-150">
          <Link to="/student-login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            <span>Cancel and return</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ResetPassword;
