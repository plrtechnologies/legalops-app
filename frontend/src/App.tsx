import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider, theme, Spin, Result } from 'antd';
import { useAuthStore } from './store/auth.store';
import { useTenantBrandingStore } from './store/tenant-branding.store';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import OpinionRequestsListPage from './pages/opinion-requests/OpinionRequestsListPage';
import OpinionRequestDetailPage from './pages/opinion-requests/OpinionRequestDetailPage';
import OpinionsPage from './pages/opinions/OpinionsPage';
import TenantSettingsPage from './pages/admin/TenantSettingsPage';
import UsersPage from './pages/admin/UsersPage';
import BankClientsPage from './pages/admin/BankClientsPage';
import EndCustomersPage from './pages/admin/EndCustomersPage';
import OpinionTemplatesPage from './pages/admin/OpinionTemplatesPage';
import AuditLogsReportPage from './pages/reports/AuditLogsReportPage';
import ReportsPage from './pages/reports/ReportsPage';
import WelcomePage from './pages/auth/WelcomePage';
import RegisterPage from './pages/auth/RegisterPage';
import { AUDIT_REPORT_ROLES, TENANT_BRANDING_ROLES } from './lib/tenant-roles';

function ThemedApp({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const branding = useTenantBrandingStore((s) => s.branding);
  const loadBranding = useTenantBrandingStore((s) => s.loadBranding);
  const clearBranding = useTenantBrandingStore((s) => s.clearBranding);

  useEffect(() => {
    if (isAuthenticated) {
      void loadBranding();
    } else {
      clearBranding();
    }
  }, [isAuthenticated, loadBranding, clearBranding]);

  const raw = branding?.primaryColor?.trim();
  const primary =
    raw && /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(raw) ? raw : '#1677ff';

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: primary } }}>
      {children}
    </ConfigProvider>
  );
}

/** Query string for `/welcome`: keep `code`/`slug` from the attempted URL, else optional default from env. */
function welcomeSearchFromLocation(search: string): string {
  const params = new URLSearchParams(search);
  const hasTenant = params.has('code') || params.has('slug');
  const defaultCode = import.meta.env.VITE_DEFAULT_TENANT_CODE?.trim();
  if (!hasTenant && defaultCode) params.set('code', defaultCode);
  const s = params.toString();
  return s ? `?${s}` : '';
}

function ProtectedRoute({
  children,
  requiredRoles,
}: {
  children: React.ReactNode;
  requiredRoles?: string[];
}) {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="Signing you in..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    const qs = welcomeSearchFromLocation(location.search);
    return <Navigate to={`/welcome${qs}`} replace state={{ from: location }} />;
  }

  if (requiredRoles?.length) {
    const hasAccess = requiredRoles.some((r) => user?.roles?.includes(r));
    if (!hasAccess) {
      return <Result status="403" title="Access denied" subTitle="You do not have permission to view this page." />;
    }
  }

  return <>{children}</>;
}

const TENANT_ADMIN_ROLES = [...TENANT_BRANDING_ROLES];
const FIRM_ADMIN_ROLES = ['super_admin', 'firm_admin'];

export default function App() {
  return (
    <ThemedApp>
      <BrowserRouter>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="opinion-requests"
              element={
                <ProtectedRoute requiredRoles={['super_admin', 'firm_admin', 'senior_advocate', 'panel_advocate', 'paralegal']}>
                  <OpinionRequestsListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="opinion-requests/:id"
              element={
                <ProtectedRoute requiredRoles={['super_admin', 'firm_admin', 'senior_advocate', 'panel_advocate', 'paralegal']}>
                  <OpinionRequestDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="opinion-requests/:opinionRequestId/opinions/:opinionId"
              element={
                <ProtectedRoute requiredRoles={['super_admin', 'firm_admin', 'senior_advocate', 'panel_advocate']}>
                  <OpinionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/tenant"
              element={
                <ProtectedRoute requiredRoles={TENANT_ADMIN_ROLES}>
                  <TenantSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/users"
              element={
                <ProtectedRoute requiredRoles={FIRM_ADMIN_ROLES}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/bank-clients"
              element={
                <ProtectedRoute requiredRoles={FIRM_ADMIN_ROLES}>
                  <BankClientsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/bank-clients/:bankClientId/end-customers"
              element={
                <ProtectedRoute requiredRoles={FIRM_ADMIN_ROLES}>
                  <EndCustomersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/bank-clients/:bankClientId/templates"
              element={
                <ProtectedRoute requiredRoles={FIRM_ADMIN_ROLES}>
                  <OpinionTemplatesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports/audit-logs"
              element={
                <ProtectedRoute requiredRoles={[...AUDIT_REPORT_ROLES]}>
                  <AuditLogsReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports/analytics"
              element={
                <ProtectedRoute requiredRoles={['super_admin', 'firm_admin', 'senior_advocate']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemedApp>
  );
}
