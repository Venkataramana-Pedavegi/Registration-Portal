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
import AIChatWidget from './components/AIChatWidget';

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
// Sprint 6 Enterprise Admin Pages
const AdminManagement = lazy(() => import('./pages/AdminManagement'));
const RoleManagement = lazy(() => import('./pages/RoleManagement'));
const Permissions = lazy(() => import('./pages/Permissions'));
const BulkOperations = lazy(() => import('./pages/BulkOperations'));
const Settings = lazy(() => import('./pages/Settings'));
const BackupManager = lazy(() => import('./pages/BackupManager'));
const AnnouncementManager = lazy(() => import('./pages/AnnouncementManager'));
const StudentManager = lazy(() => import('./pages/StudentManager'));
const VolunteerManager = lazy(() => import('./pages/VolunteerManager'));
const EventTemplates = lazy(() => import('./pages/EventTemplates'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const Achievements = lazy(() => import('./pages/Achievements'));
const Badges = lazy(() => import('./pages/Badges'));
const VerifyPass = lazy(() => import('./pages/VerifyPass'));
const EntryVerification = lazy(() => import('./pages/EntryVerification'));

// Sprint 8 AI Pages
const AIRecommendations = lazy(() => import('./pages/AIRecommendations'));
const AISearch = lazy(() => import('./pages/AISearch'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const AIFeedbackAnalysis = lazy(() => import('./pages/AIFeedbackAnalysis'));

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
              <div className="flex flex-col min-h-screen bg-gray-50 w-full max-w-full overflow-x-hidden">
            <Navbar />
            <main className="flex-grow flex flex-col w-full max-w-full overflow-x-hidden">
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
                  <Route path="/forgot-password" element={<ForgotPassword setToast={setToast} />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/500" element={<Error500 />} />

                  {/* Public Enterprise Routes */}
                  <Route path="/calendar" element={<EventCalendar />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/verify-certificate" element={<PublicCertificateVerify />} />
                  <Route path="/verify-certificate/:certificateId" element={<PublicCertificateVerify />} />
                  <Route path="/verify-pass/:registrationId" element={<VerifyPass />} />
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
                  {/* Sprint 6 Enterprise Admin Routes */}
                  <Route
                    path="/admin/admins"
                    element={
                      <ProtectedRoute allowedRoles={['Admin']}>
                        <AdminManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/roles"
                    element={
                      <ProtectedRoute allowedRoles={['Admin']}>
                        <RoleManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/permissions"
                    element={
                      <ProtectedRoute allowedRoles={['Admin']}>
                        <Permissions />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/bulk"
                    element={
                      <ProtectedRoute allowedRoles={['Admin']}>
                        <BulkOperations />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/system-settings"
                    element={
                      <ProtectedRoute allowedRoles={['Admin']}>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/backups"
                    element={
                      <ProtectedRoute allowedRoles={['Admin']}>
                        <BackupManager />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/announcements"
                    element={
                      <ProtectedRoute allowedRoles={['Admin']}>
                        <AnnouncementManager />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/students"
                    element={
                      <ProtectedRoute allowedRoles={['Admin']}>
                        <StudentManager />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/volunteer-network"
                    element={
                      <ProtectedRoute allowedRoles={['Admin']}>
                        <VolunteerManager />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/templates"
                    element={
                      <ProtectedRoute allowedRoles={['Admin']}>
                        <EventTemplates />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/entry-verification"
                    element={
                      <ProtectedRoute allowedRoles={['Admin', 'ApprovedVolunteer']}>
                        <EntryVerification />
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

                  <Route
                    path="/ai-recommendations"
                    element={
                      <ProtectedRoute allowedRoles={['Student', 'Admin']}>
                        <AIRecommendations />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/ai-search"
                    element={
                      <ProtectedRoute allowedRoles={['Student', 'Admin']}>
                        <AIAssistant />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/ai-assistant"
                    element={
                      <ProtectedRoute allowedRoles={['Student', 'Admin']}>
                        <AIAssistant />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/ai-feedback-analysis"
                    element={
                      <ProtectedRoute allowedRoles={['Admin']}>
                        <AIFeedbackAnalysis />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="*" element={<Error404 />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
            
            {/* Floating AI Chatbot Widget */}
            <AIChatWidget />

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
