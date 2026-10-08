import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { AboutPage } from './pages/public/AboutPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';

// Common Error Pages
import { NotFoundPage } from './pages/common/NotFoundPage';
import { UnauthorizedPage } from './pages/common/UnauthorizedPage';

// Citizen Portal Pages
import { CitizenDashboard } from './pages/citizen/CitizenDashboard';
import { CitizenReportIssue } from './pages/citizen/CitizenReportIssue';
import { CitizenMyIssues } from './pages/citizen/CitizenMyIssues';
import { CitizenIssueDetails } from './pages/citizen/CitizenIssueDetails';
import { CitizenNearbyIssues } from './pages/citizen/CitizenNearbyIssues';
import { CitizenMapPage } from './pages/citizen/CitizenMapPage';
import { CitizenNotifications } from './pages/citizen/CitizenNotifications';
import { CitizenProfile } from './pages/citizen/CitizenProfile';

// Authority Portal Pages
import { AuthorityDashboard } from './pages/authority/AuthorityDashboard';
import { AuthorityPriorityQueue } from './pages/authority/AuthorityPriorityQueue';
import { AuthorityAllIssues } from './pages/authority/AuthorityAllIssues';
import { AuthorityDuplicateReview } from './pages/authority/AuthorityDuplicateReview';
import { AuthorityMasterIssue } from './pages/authority/AuthorityMasterIssue';
import { AuthorityMapPage } from './pages/authority/AuthorityMapPage';
import { AuthorityAssignments } from './pages/authority/AuthorityAssignments';
import { AuthorityDepartments } from './pages/authority/AuthorityDepartments';
import { AuthorityTeams } from './pages/authority/AuthorityTeams';
import { AuthorityAnalytics } from './pages/authority/AuthorityAnalytics';
import { AuthorityAIAssistant } from './pages/authority/AuthorityAIAssistant';
import { AuthorityAuditLogs } from './pages/authority/AuthorityAuditLogs';
import { AuthoritySettings } from './pages/authority/AuthoritySettings';

// Worker Portal Pages
import { WorkerDashboard } from './pages/worker/WorkerDashboard';
import { WorkerAssignedIssues } from './pages/worker/WorkerAssignedIssues';
import { WorkerActiveWork } from './pages/worker/WorkerActiveWork';
import { WorkerCompleted } from './pages/worker/WorkerCompleted';
import { WorkerIssueDetail } from './pages/worker/WorkerIssueDetail';
import { WorkerProfile } from './pages/worker/WorkerProfile';

// Admin Portal Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminDepartments } from './pages/admin/AdminDepartments';
import { AdminTeams } from './pages/admin/AdminTeams';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminSLA } from './pages/admin/AdminSLA';
import { AdminSystemHealth } from './pages/admin/AdminSystemHealth';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { AdminSettings } from './pages/admin/AdminSettings';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppShell>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Citizen Routes */}
              <Route
                path="/citizen"
                element={
                  <ProtectedRoute allowedRoles={['Citizen']}>
                    <CitizenDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citizen/report"
                element={
                  <ProtectedRoute allowedRoles={['Citizen']}>
                    <CitizenReportIssue />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citizen/issues"
                element={
                  <ProtectedRoute allowedRoles={['Citizen']}>
                    <CitizenMyIssues />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citizen/issues/:id"
                element={
                  <ProtectedRoute allowedRoles={['Citizen']}>
                    <CitizenIssueDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citizen/nearby"
                element={
                  <ProtectedRoute allowedRoles={['Citizen']}>
                    <CitizenNearbyIssues />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citizen/map"
                element={
                  <ProtectedRoute allowedRoles={['Citizen']}>
                    <CitizenMapPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citizen/notifications"
                element={
                  <ProtectedRoute allowedRoles={['Citizen']}>
                    <CitizenNotifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citizen/profile"
                element={
                  <ProtectedRoute allowedRoles={['Citizen']}>
                    <CitizenProfile />
                  </ProtectedRoute>
                }
              />

              {/* Authority Routes */}
              <Route
                path="/authority"
                element={
                  <ProtectedRoute allowedRoles={['Authority']}>
                    <AuthorityDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/authority/queue"
                element={
                  <ProtectedRoute allowedRoles={['Authority']}>
                    <AuthorityPriorityQueue />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/authority/issues"
                element={
                  <ProtectedRoute allowedRoles={['Authority']}>
                    <AuthorityAllIssues />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/authority/map"
                element={
                  <ProtectedRoute allowedRoles={['Authority']}>
                    <AuthorityMapPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/authority/triage"
                element={
                  <ProtectedRoute allowedRoles={['Authority']}>
                    <AuthorityDuplicateReview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/authority/master/:id"
                element={
                  <ProtectedRoute allowedRoles={['Authority']}>
                    <AuthorityMasterIssue />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/authority/assignments"
                element={
                  <ProtectedRoute allowedRoles={['Authority']}>
                    <AuthorityAssignments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/authority/departments"
                element={
                  <ProtectedRoute allowedRoles={['Authority']}>
                    <AuthorityDepartments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/authority/teams"
                element={
                  <ProtectedRoute allowedRoles={['Authority']}>
                    <AuthorityTeams />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/authority/analytics"
                element={
                  <ProtectedRoute allowedRoles={['Authority']}>
                    <AuthorityAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/authority/ai-assistant"
                element={
                  <ProtectedRoute allowedRoles={['Authority']}>
                    <AuthorityAIAssistant />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/authority/audit"
                element={
                  <ProtectedRoute allowedRoles={['Authority']}>
                    <AuthorityAuditLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/authority/settings"
                element={
                  <ProtectedRoute allowedRoles={['Authority']}>
                    <AuthoritySettings />
                  </ProtectedRoute>
                }
              />

              {/* Worker Routes */}
              <Route
                path="/worker"
                element={
                  <ProtectedRoute allowedRoles={['Worker']}>
                    <WorkerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/worker/assigned"
                element={
                  <ProtectedRoute allowedRoles={['Worker']}>
                    <WorkerAssignedIssues />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/worker/active"
                element={
                  <ProtectedRoute allowedRoles={['Worker']}>
                    <WorkerActiveWork />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/worker/completed"
                element={
                  <ProtectedRoute allowedRoles={['Worker']}>
                    <WorkerCompleted />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/worker/issues/:id"
                element={
                  <ProtectedRoute allowedRoles={['Worker']}>
                    <WorkerIssueDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/worker/profile"
                element={
                  <ProtectedRoute allowedRoles={['Worker']}>
                    <WorkerProfile />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/departments"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminDepartments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/teams"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminTeams />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/categories"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminCategories />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/sla"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminSLA />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/health"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminSystemHealth />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminAuditLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminSettings />
                  </ProtectedRoute>
                }
              />

              {/* 404 Catch All */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
