import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './auth/LoginPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { IncidentProvider } from './context/IncidentContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import { WelcomePage } from './pages/WelcomePage';
import { OverviewPage } from './pages/OverviewPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DispatchPage } from './pages/DispatchPage';
import { NewsPage } from './pages/NewsPage';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Welcome Page (Explains What ResQVision Is, Use Cases, Core Architecture) */}
              <Route path="/" element={<WelcomePage />} />

              {/* Public Login Route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Two Main Pages & Protected Command Center Routes */}
              <Route
                path="/overview"
                element={
                  <ProtectedRoute>
                    <IncidentProvider>
                      <OverviewPage />
                    </IncidentProvider>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/rescue"
                element={
                  <ProtectedRoute>
                    <IncidentProvider>
                      <DispatchPage />
                    </IncidentProvider>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/incidents"
                element={
                  <ProtectedRoute>
                    <IncidentProvider>
                      <IncidentsPage />
                    </IncidentProvider>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <IncidentProvider>
                      <AnalyticsPage />
                    </IncidentProvider>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dispatch"
                element={
                  <ProtectedRoute>
                    <IncidentProvider>
                      <DispatchPage />
                    </IncidentProvider>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/news"
                element={
                  <ProtectedRoute>
                    <IncidentProvider>
                      <NewsPage />
                    </IncidentProvider>
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
