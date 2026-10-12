import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CustomThemeProvider } from './ThemeContext'
import Layout from './Layout'
import Dashboard from './pages/Dashboard'
import Policies from './pages/Policies'
import PolicyDetail from './pages/PolicyDetail'
import NewAnalysis from './pages/NewAnalysis'
import Comparisons from './pages/Comparisons'
import EvidenceAudit from './pages/EvidenceAudit'
import ReportPage from './pages/Report'
import Logs from './pages/Logs'
import Settings from './pages/Settings'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CustomThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="policies" element={<Policies />} />
              <Route path="policies/:id" element={<PolicyDetail />} />
              <Route path="new-analysis" element={<NewAnalysis />} />
              <Route path="comparisons" element={<Comparisons />} />
              <Route path="audit" element={<EvidenceAudit />} />
              <Route path="report/:comparisonId" element={<ReportPage />} />
              <Route path="logs" element={<Logs />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CustomThemeProvider>
    </QueryClientProvider>
  )
}

export default App