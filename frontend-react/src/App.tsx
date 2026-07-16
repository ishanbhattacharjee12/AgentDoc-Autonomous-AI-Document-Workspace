import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell/AppShell'
import { GeneratePage } from '@/pages/GeneratePage/GeneratePage'
import { HistoryPage } from '@/pages/HistoryPage/HistoryPage'
import { SettingsPage } from '@/pages/SettingsPage/SettingsPage'

function App() {
  return (
    <AppShell>
      <Routes>
        {/* Redirect Root path to /generate page */}
        <Route path="/" element={<Navigate to="/generate" replace />} />
        
        {/* App Pages */}
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppShell>
  )
}

export default App
