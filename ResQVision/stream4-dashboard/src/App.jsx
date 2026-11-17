import { Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useAppState } from './context/AppContext.jsx';
import CitizenLayout from './components/citizen/CitizenLayout.jsx';
import GovernmentLayout from './components/government/GovernmentLayout.jsx';
import PortalGatewayPage from './pages/PortalGatewayPage.jsx';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage.jsx';
import TermsPage from './pages/TermsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import VerifyImagePage from './pages/VerifyImagePage.jsx';
import CitizenLoginPage from './pages/citizen/CitizenLoginPage.jsx';
import CitizenMapPage from './pages/citizen/CitizenMapPage.jsx';
import CitizenResourcesPage from './pages/citizen/CitizenResourcesPage.jsx';
import CitizenVolunteerPage from './pages/citizen/CitizenVolunteerPage.jsx';
import CitizenSosPage from './pages/citizen/CitizenSosPage.jsx';
import CitizenHistoryPage from './pages/citizen/CitizenHistoryPage.jsx';
import CitizenSafetyPage from './pages/citizen/CitizenSafetyPage.jsx';
import CitizenContactsPage from './pages/citizen/CitizenContactsPage.jsx';
import GovernmentLoginPage from './pages/government/GovernmentLoginPage.jsx';
import GovernmentOverviewPage from './pages/government/GovernmentOverviewPage.jsx';
import GovernmentLiveMapPage from './pages/government/GovernmentLiveMapPage.jsx';
import GovernmentSosAlertsPage from './pages/government/GovernmentSosAlertsPage.jsx';
import GovernmentOperationsPage from './pages/government/GovernmentOperationsPage.jsx';
import GovernmentRescueHistoryPage from './pages/government/GovernmentRescueHistoryPage.jsx';
import GovernmentResourcesPage from './pages/government/GovernmentResourcesPage.jsx';
import GovernmentIntelligencePage from './pages/government/GovernmentIntelligencePage.jsx';
import GovernmentAuditLogsPage from './pages/government/GovernmentAuditLogsPage.jsx';
import GovernmentSettingsPage from './pages/government/GovernmentSettingsPage.jsx';

function CitizenGuard({ children }) {
  const { citizenUser } = useAppState();
  if (!citizenUser) return <Navigate to="/login?role=citizen" replace />;
  return children;
}

function GovernmentGuard({ children }) {
  const { governmentUser } = useAppState();
  if (!governmentUser) return <Navigate to="/login?role=government" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Welcome / Landing Single-Page Experience (§12) */}
      <Route path="/" element={<PortalGatewayPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/verify" element={<VerifyImagePage />} />

      {/* Combined Unified Sign In Gateway (§6, §7) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/citizen/login" element={<CitizenLoginPage />} />
      <Route path="/government/login" element={<GovernmentLoginPage />} />

      {/* Citizen Portal Grouped Routes (§3, §7, §8, §10-17, §18-23) */}
      <Route
        path="/citizen"
        element={
          <CitizenGuard>
            <CitizenLayout />
          </CitizenGuard>
        }
      >
        <Route index element={<Navigate to="/citizen/map" replace />} />
        <Route path="map" element={<CitizenMapPage />} />
        {/* Resource Discovery Hub (MAP + LIST pattern §10-15) */}
        <Route path="resources" element={<CitizenResourcesPage />} />
        <Route path="resources/:category" element={<CitizenResourcesPage />} />
        {/* Volunteer With Us community registration (§16) */}
        <Route path="volunteer" element={<CitizenVolunteerPage />} />
        {/* Emergency SOS Workflow (§17-20) */}
        <Route path="sos" element={<CitizenSosPage />} />
        {/* My SOS History (§21) */}
        <Route path="history" element={<CitizenHistoryPage />} />
        <Route path="sos/history" element={<CitizenHistoryPage />} />
        {/* Safety Information (§23) & Emergency Contacts (§3) */}
        <Route path="safety" element={<CitizenSafetyPage />} />
        <Route path="emergency-contacts" element={<CitizenContactsPage />} />
      </Route>

      {/* Government / Rescue Portal Grouped Routes (§3, §24-31, §35-41) */}
      <Route
        path="/government"
        element={
          <GovernmentGuard>
            <GovernmentLayout />
          </GovernmentGuard>
        }
      >
        <Route index element={<Navigate to="/government/overview" replace />} />
        {/* OPERATIONS (§25-27) */}
        <Route path="overview" element={<GovernmentOverviewPage />} />
        <Route path="map" element={<GovernmentLiveMapPage />} />
        <Route path="live-map" element={<GovernmentLiveMapPage />} />
        <Route path="sos" element={<GovernmentSosAlertsPage />} />
        <Route path="sos-alerts" element={<GovernmentSosAlertsPage />} />

        {/* RESPONSE (§28-30) */}
        <Route path="rescue" element={<GovernmentOperationsPage />} />
        <Route path="operations" element={<GovernmentOperationsPage />} />
        <Route path="rescue/history" element={<GovernmentRescueHistoryPage />} />
        <Route path="rescue-history" element={<GovernmentRescueHistoryPage />} />
        <Route path="resources" element={<GovernmentResourcesPage />} />

        {/* INTELLIGENCE (§31, §35-40) */}
        <Route path="intelligence" element={<GovernmentIntelligencePage />} />
        <Route path="intelligence/:tab" element={<GovernmentIntelligencePage />} />

        {/* SYSTEM / AUDIT (§41) */}
        <Route path="audit" element={<GovernmentAuditLogsPage />} />
        <Route path="system/audit" element={<GovernmentAuditLogsPage />} />
        <Route path="settings" element={<GovernmentSettingsPage />} />
        <Route path="system/settings" element={<GovernmentSettingsPage />} />
        <Route path="system/profile" element={<GovernmentSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
