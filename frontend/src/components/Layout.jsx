import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import RoleNavbar from './RoleNavbar'
import RoleSidebar from './RoleSidebar'
import { useAuth, ROLE_CONFIGS } from '../context/AuthContext'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()
  const role = user?.role || 'admin'
  const config = ROLE_CONFIGS[role] || ROLE_CONFIGS.admin

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-brand-950 text-slate-800 dark:text-slate-100">
      <RoleSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <RoleNavbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
