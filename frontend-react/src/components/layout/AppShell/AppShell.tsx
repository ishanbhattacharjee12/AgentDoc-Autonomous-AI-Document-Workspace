import React from 'react'
import { Sidebar } from '../Sidebar/Sidebar'

interface AppShellProps {
  children?: React.ReactNode
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-background">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden p-6 md:p-10">
        <div className="mx-auto w-full max-w-[960px] animate-[fadeIn_0.3s_ease-out]">
          {children}
        </div>
      </main>
    </div>
  )
}
export default AppShell
