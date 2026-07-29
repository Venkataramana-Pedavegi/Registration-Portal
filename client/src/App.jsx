import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Toast from './components/Toast';

// Pages
import Home from './pages/Home';
import StudentRegister from './pages/StudentRegister';
import StudentLogin from './pages/StudentLogin';
import AdminLogin from './pages/AdminLogin';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import EventDetails from './pages/EventDetails';
import NotFound from './pages/NotFound';

function App() {
  const [toast, setToast] = useState(null);

  const handleCloseToast = () => {
    setToast(null);
  };

  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Navbar />
          <main className="flex-grow flex flex-col">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/student-register" element={<StudentRegister setToast={setToast} />} />
              <Route path="/student-login" element={<StudentLogin setToast={setToast} />} />
              <Route path="/admin-login" element={<AdminLogin setToast={setToast} />} />
              
              <Route
                path="/student-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['Student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:id"
                element={
                  <ProtectedRoute allowedRoles={['Student', 'Admin']}>
                    <EventDetails />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
          
          {toast && (
            <Toast
              type={toast.type}
              message={toast.message}
              onClose={handleCloseToast}
            />
          )}
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
