import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from './components/Layout'
import { DashboardPage } from './pages/Dashboard'
import { ActivityPage } from './pages/Activity'
import { ScreenshotsPage } from './pages/Screenshots'
import { PatternsPage } from './pages/Patterns'
import { AutomationsPage } from './pages/Automations'
import { AgentsPage } from './pages/Agents'
import { ApprovalsPage } from './pages/Approvals'
import { AuditPage } from './pages/Audit'
import { SettingsPage } from './pages/Settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 10_000,
      staleTime: 5_000,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/screenshots" element={<ScreenshotsPage />} />
            <Route path="/patterns" element={<PatternsPage />} />
            <Route path="/automations" element={<AutomationsPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
