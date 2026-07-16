import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell/AppShell'

const LandingPage = lazy(() =>
  import('@/pages/LandingPage/LandingPage').then((m) => ({ default: m.LandingPage }))
)
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
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen w-full bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <Routes>
        {/* Landing Page (Full Viewport, no sidebar) */}
        <Route path="/" element={<LandingPage />} />

        {/* Workspace Routes (Wrapped inside AppShell with sidebar) */}
        <Route
          path="/*"
          element={
            <AppShell>
              <Routes>
                <Route path="generate" element={<GeneratePage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          }
        />
      </Routes>
    </Suspense>
  )
}

export default App
