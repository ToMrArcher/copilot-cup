import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { KpiPage } from './features/kpi/KpiPage'
import { IntegrationsPage } from './features/integrations/IntegrationsPage'
import { IntegrationWizard } from './features/integrations/IntegrationWizard'
import { AuthPage } from './features/auth/AuthPage'
import { SharingPage } from './features/sharing/SharingPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="kpis" element={<KpiPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="integrations/new" element={<IntegrationWizard />} />
          <Route path="auth" element={<AuthPage />} />
          <Route path="sharing" element={<SharingPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
