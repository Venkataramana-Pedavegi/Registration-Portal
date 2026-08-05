import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserPlus, Loader2 } from 'lucide-react';

const StudentRegister = ({ setToast }) => {
  const { registerStudent } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    rollNumber: '',
    email: '',
    department: '',
    year: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departments = ['Computer Science', 'Electronics & Communication', 'Electrical & Electronics', 'Mechanical', 'Civil', 'Information Technology'];
  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!formData.rollNumber.trim()) errors.rollNumber = 'Roll Number is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email address';
    }
    if (!formData.department) errors.department = 'Department selection is required';
    if (!formData.year) errors.year = 'Year selection is required';
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    const result = await registerStudent(formData);
    setIsSubmitting(false);

    if (result.success) {
      setToast({ type: 'success', message: 'Registration Successful!' });
      navigate('/student-dashboard');
    } else {
      setToast({ type: 'error', message: result.message });
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
          <p className="text-sm font-semibold text-primary-700 mt-1 mb-2">Student Account Registration</p>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/student-login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                className={`mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border ${
                  formErrors.fullName ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                placeholder="Full Name"
              />
              {formErrors.fullName && <p className="mt-1 text-xs text-red-500">{formErrors.fullName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Roll Number</label>
              <input
                id="rollNumber"
                name="rollNumber"
                type="text"
                value={formData.rollNumber}
                onChange={handleChange}
                className={`mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border ${
                  formErrors.rollNumber ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                placeholder="e.g. CS202601"
              />
              {formErrors.rollNumber && <p className="mt-1 text-xs text-red-500">{formErrors.rollNumber}</p>}
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={`mt-1 block w-full py-2 px-3 border ${
                    formErrors.department ? 'border-red-300' : 'border-gray-300'
                  } bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                >
                  <option value="">Select</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                {formErrors.department && <p className="mt-1 text-xs text-red-500">{formErrors.department}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Year</label>
                <select
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className={`mt-1 block w-full py-2 px-3 border ${
                    formErrors.year ? 'border-red-300' : 'border-gray-300'
                  } bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                >
                  <option value="">Select</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                {formErrors.year && <p className="mt-1 text-xs text-red-500">{formErrors.year}</p>}
              </div>
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
                placeholder="Min 6 characters"
              />
              {formErrors.password && <p className="mt-1 text-xs text-red-500">{formErrors.password}</p>}
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
                'Register'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentRegister;
