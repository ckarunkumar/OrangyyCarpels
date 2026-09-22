import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/ui/Layout';
import ErrorBoundary from './components/ui/ErrorBoundary';
import LoginView from './components/features/LoginView';
import DashboardView from './components/features/DashboardView';
import TimesheetsView from './components/features/TimesheetsView';
import EmployeesView from './components/features/EmployeesView';
import ClientsView from './components/features/ClientsView';
import ProjectsView from './components/features/ProjectsView';
import ReportsView from './components/features/ReportsView';
import LeavesView from './components/features/LeavesView';
import GeneralSettingsView from './components/features/GeneralSettingsView';
import { ShieldAlert } from 'lucide-react';

function AppContent() {
  const { user, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-studio-bg flex flex-col justify-center items-center font-sans">
        <img
          src="/logo.svg"
          alt="Orangyy Carpels"
          className="w-10 h-10 object-contain animate-pulse mb-3"
        />
        <span className="text-[12px] text-studio-muted font-medium">Loading Studio OS...</span>
      </div>
    );
  }

  if (!user || !role) {
    return <LoginView />;
  }

  // Gated Route protection component
  interface ProtectedRouteProps {
    children: React.ReactElement;
  }

  const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    if (role !== 'Super Admin' && role !== 'Project Manager') {
      return (
        <div className="max-w-md mx-auto mt-12 bg-white border border-studio-border rounded-lg p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-studio-text">Restricted Access</h3>
            <p className="text-[12px] text-studio-muted mt-1 leading-relaxed">
              Your account role ({role}) does not have permission to view this page. Contact your administrator if you need registry access.
            </p>
          </div>
        </div>
      );
    }
    return children;
  };

  const SuperAdminRoute = ({ children }: ProtectedRouteProps) => {
    if (role !== 'Super Admin') {
      return (
        <div className="max-w-md mx-auto mt-12 bg-white border border-studio-border rounded-lg p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-studio-text">Super Admin Only</h3>
            <p className="text-[12px] text-studio-muted mt-1 leading-relaxed">
              General Settings can only be configured by a Super Admin.
            </p>
          </div>
        </div>
      );
    }
    return children;
  };

  return (
    <Router>
      <Layout>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<DashboardView activeRole={role} />} />
            <Route path="/timesheets" element={<TimesheetsView activeRole={role} />} />
            <Route
              path="/employees"
              element={
                <ProtectedRoute>
                  <EmployeesView activeRole={role} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <ProtectedRoute>
                  <ClientsView activeRole={role} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <ProjectsView activeRole={role} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <ReportsView activeRole={role} />
                </ProtectedRoute>
              }
            />
            <Route path="/leaves" element={<LeavesView activeRole={role} />} />
            <Route path="/settings" element={<SuperAdminRoute><GeneralSettingsView /></SuperAdminRoute>} />
            <Route path="/settings/studio" element={<SuperAdminRoute><GeneralSettingsView /></SuperAdminRoute>} />
            <Route path="/settings/services" element={<SuperAdminRoute><GeneralSettingsView /></SuperAdminRoute>} />
            <Route path="/settings/leaves" element={<SuperAdminRoute><GeneralSettingsView /></SuperAdminRoute>} />
            <Route path="/settings/logs" element={<SuperAdminRoute><GeneralSettingsView /></SuperAdminRoute>} />
            <Route path="/settings/bl-sl" element={<SuperAdminRoute><GeneralSettingsView /></SuperAdminRoute>} />
            <Route path="/billing" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </Layout>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
