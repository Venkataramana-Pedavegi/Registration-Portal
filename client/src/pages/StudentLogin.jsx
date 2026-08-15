import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogIn, Loader2 } from 'lucide-react';

const StudentLogin = ({ setToast }) => {
  const { loginStudent } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email address';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    return errors;
  };

  const [showResend, setShowResend] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setShowResend(false);
    const result = await loginStudent(formData.email, formData.password);
    setIsSubmitting(false);

    if (result.success) {
      setToast({ type: 'success', message: 'Logged in successfully!' });
      navigate('/student-dashboard');
    } else {
      setToast({ type: 'error', message: result.message });
      if (result.message && result.message.toLowerCase().includes('verify your email')) {
        setShowResend(true);
      }
    }
  };

  const handleResend = async () => {
    if (!formData.email) return;
    setIsResending(true);
    try {
      const api = (await import('../services/api')).default;
      const { data } = await api.post('/student/resend-verification', { email: formData.email });
      setToast({ type: 'success', message: data.message || 'Verification link sent to your email!' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to resend verification link.' });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div className="text-center">
          <img
            src="/sri_vasavi_logo.png"
            alt="Sri Vasavi Engineering College Logo"
            className="mx-auto h-16 w-16 object-contain rounded-full shadow-sm border border-primary-100 bg-white p-0.5 mb-3"
          />
          <h2 className="text-2xl font-extrabold text-gray-900">Sri Vasavi Engineering College</h2>
          <p className="text-sm font-semibold text-primary-700 mt-1 mb-2">Student Portal Login</p>
          <p className="mt-2 text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/student-register" className="font-medium text-primary-600 hover:text-primary-500">
              Register now
            </Link>
          </p>
        </div>

        {showResend && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-center animate-in fade-in duration-300">
            <p className="text-xs text-amber-800 font-medium">
              Your account requires email verification. Check your inbox or click below to receive a new link.
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {isResending ? <Loader2 className="animate-spin h-3.5 w-3.5 text-white" /> : '📩 Resend Verification Email'}
            </button>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border ${
                  formErrors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                placeholder="email@college.edu"
              />
              {formErrors.email && <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={`mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border ${
                  formErrors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                placeholder="Password"
              />
              {formErrors.password && <p className="mt-1 text-xs text-red-500">{formErrors.password}</p>}
              
              <div className="flex justify-end mt-2">
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-primary-600 hover:text-primary-500 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin h-5 w-5 text-white" />
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentLogin;
