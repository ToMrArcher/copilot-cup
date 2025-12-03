import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { KpiPage } from './features/kpi/KpiPage'
import { IntegrationsPage } from './features/integrations/IntegrationsPage'
import { IntegrationWizard } from './features/integrations/IntegrationWizard'
import { AuthPage, AuthProvider, ProtectedRoute, ProfilePage, AdminUsersPage } from './features/auth'
import { SharingPage, PublicShareView } from './features/sharing'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Protected Routes */}
              <Route
                index
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="kpis"
                element={
                  <ProtectedRoute>
                    <KpiPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="integrations"
                element={
                  <ProtectedRoute>
                    <IntegrationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="integrations/new"
                element={
                  <ProtectedRoute>
                    <IntegrationWizard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="sharing"
                element={
                  <ProtectedRoute>
                    <SharingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AdminUsersPage />
                  </ProtectedRoute>
                }
              />
              
              {/* Public Routes */}
              <Route path="auth" element={<AuthPage />} />
            </Route>

            {/* Public Share Routes (outside Layout) */}
            <Route path="share/:token" element={<PublicShareView />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
