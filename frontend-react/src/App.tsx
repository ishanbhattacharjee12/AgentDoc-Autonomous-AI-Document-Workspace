import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell/AppShell'

const GeneratePage = lazy(() =>
  import('@/pages/GeneratePage/GeneratePage').then((m) => ({ default: m.GeneratePage }))
)
const HistoryPage = lazy(() =>
  import('@/pages/HistoryPage/HistoryPage').then((m) => ({ default: m.HistoryPage }))
)
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage/SettingsPage').then((m) => ({ default: m.SettingsPage }))
)

function App() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }
      >
        <Routes>
          {/* Redirect Root path to /generate page */}
          <Route path="/" element={<Navigate to="/generate" replace />} />

          {/* App Pages */}
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Suspense>
    </AppShell>
  )
}

export default App
