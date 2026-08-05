import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Loader from './Loader';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, role, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader size="large" />
      </div>
    );
  }

  if (!token) {
    const isAskingForAdmin = allowedRoles?.some((r) =>
      ['Admin', 'Super Admin', 'Event Coordinator', 'Faculty Coordinator'].includes(r)
    );
    const redirectPath = isAskingForAdmin ? '/admin-login' : '/student-login';
    return <Navigate to={redirectPath} replace />;
  }

  if (allowedRoles) {
    const adminGroup = ['Admin', 'Super Admin', 'Event Coordinator', 'Faculty Coordinator'];
    const studentGroup = ['Student', 'Volunteer'];

    const userHasAccess = allowedRoles.some((allowed) => {
      if (allowed === 'Admin' && adminGroup.includes(role)) return true;
      if (allowed === 'Student' && (studentGroup.includes(role) || !role)) return true;
      return allowed === role;
    });

    if (!userHasAccess) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
