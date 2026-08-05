import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketProvider';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Loader from './components/Loader';
import Toast from './components/Toast';
import AIChatbotWidget from './components/AIChatbotWidget';

// Lazy Loaded Pages
const Home = lazy(() => import('./pages/Home'));
const StudentRegister = lazy(() => import('./pages/StudentRegister'));
const StudentLogin = lazy(() => import('./pages/StudentLogin'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const EventDetails = lazy(() => import('./pages/EventDetails'));
const MyRegistrations = lazy(() => import('./pages/MyRegistrations'));
const RegistrationHistory = lazy(() => import('./pages/RegistrationHistory'));
const Participants = lazy(() => import('./pages/Participants'));
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Reports = lazy(() => import('./pages/Reports'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const ExportReports = lazy(() => import('./pages/ExportReports'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));

// Phase 5 Lazy Loaded Pages
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Certificates = lazy(() => import('./pages/Certificates'));
const QRCode = lazy(() => import('./pages/QRCode'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const Error404 = lazy(() => import('./pages/Error404'));
const Error500 = lazy(() => import('./pages/Error500'));
const NotFound = lazy(() => import('./pages/NotFound'));

// New Enterprise Feature Pages
const EventCalendar = lazy(() => import('./pages/EventCalendar'));
const PublicCertificateVerify = lazy(() => import('./pages/PublicCertificateVerify'));
const VolunteerManagement = lazy(() => import('./pages/VolunteerManagement'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const Gallery = lazy(() => import('./pages/Gallery'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const Achievements = lazy(() => import('./pages/Achievements'));
const Badges = lazy(() => import('./pages/Badges'));

function App() {
  const [toast, setToast] = useState(null);

  const handleCloseToast = () => {
    setToast(null);
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <Router>
              <div className="flex flex-col min-h-screen bg-gray-50">
            <Navbar />
            <main className="flex-grow flex flex-col">
              <Suspense fallback={
                <div className="flex-grow flex items-center justify-center bg-gray-50 py-20">
                  <Loader size="large" />
                </div>
              }>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/student-register" element={<StudentRegister setToast={setToast} />} />
                  <Route path="/student-login" element={<StudentLogin setToast={setToast} />} />
                  <Route path="/admin-login" element={<AdminLogin setToast={setToast} />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/500" element={<Error500 />} />

                  {/* Public Enterprise Routes */}
                  <Route path="/calendar" element={<EventCalendar />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/verify-certificate" element={<PublicCertificateVerify />} />
                  <Route path="/verify-certificate/:certificateId" element={<PublicCertificateVerify />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />

                  {/* Shared Protected Routes */}
                  <Route
                    path="/volunteers"
                    element={
                      <ProtectedRoute allowedRoles={['Student', 'Admin']}>
                        <VolunteerManagement />
                      </ProtectedRoute>
                    }
                  />


                  {/* Student Protected Routes */}
                  <Route
                    path="/student-dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['Student']}>
                        <StudentDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/my-registrations"
                    element={
                      <ProtectedRoute allowedRoles={['Student']}>
                        <MyRegistrations />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/registration-history"
                    element={
                      <ProtectedRoute allowedRoles={['Student']}>
                        <RegistrationHistory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/certificates"
                    element={
                      <ProtectedRoute allowedRoles={['Student']}>
                        <Certificates />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/achievements"
                    element={
                      <ProtectedRoute allowedRoles={['Student']}>
                        <Achievements />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/badges"
                    element={
                      <ProtectedRoute allowedRoles={['Student']}>
                        <Badges />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin Protected Routes */}
                  <Route
                    path="/admin-dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['Admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/analytics-dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['Admin']}>
                        <AnalyticsDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/attendance"
                    element={
                      <ProtectedRoute allowedRoles={['Admin']}>
                        <Attendance />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute allowedRoles={['Admin']}>
                        <Reports />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/export-reports"
                    element={
                      <ProtectedRoute allowedRoles={['Admin']}>
                        <ExportReports />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin-settings"
                    element={
                      <ProtectedRoute allowedRoles={['Admin']}>
                        <AdminSettings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/audit-logs"
                    element={
                      <ProtectedRoute allowedRoles={['Admin']}>
                        <AuditLogs />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/student/:id/profile"
                    element={
                      <ProtectedRoute allowedRoles={['Admin']}>
                        <StudentProfile />
                      </ProtectedRoute>
                    }
                  />

                  {/* Shared Profile & Event Routes */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute allowedRoles={['Student', 'Admin']}>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute allowedRoles={['Student', 'Admin']}>
                        <Notifications />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/qrcode/:registrationId"
                    element={
                      <ProtectedRoute allowedRoles={['Student', 'Admin']}>
                        <QRCode />
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
                  <Route
                    path="/events/:id/participants"
                    element={
                      <ProtectedRoute allowedRoles={['Admin']}>
                        <Participants />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="*" element={<Error404 />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
            
            {/* Floating AI Chatbot Widget */}
            <AIChatbotWidget />

            {toast && (
              <Toast
                type={toast.type}
                message={toast.message}
                onClose={handleCloseToast}
              />
            )}
          </div>
        </Router>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
