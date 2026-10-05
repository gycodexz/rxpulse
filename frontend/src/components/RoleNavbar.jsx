import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Logo from './Logo'
import { useTheme } from '../context/ThemeContext'
import { useAuth, ROLE_CONFIGS } from '../context/AuthContext'

export default function RoleNavbar({ onToggleSidebar }) {
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const switcherRef = useRef(null)
  const userRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { user, switchRole, logout } = useAuth()

  const currentRole = user?.role || 'admin'
  const config = ROLE_CONFIGS[currentRole] || ROLE_CONFIGS.admin

  useEffect(() => {
    function onClickOutside(e) {
      if (switcherRef.current && !switcherRef.current.contains(e.target)) setRoleSwitcherOpen(false)
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-brand-800 bg-white/95 dark:bg-brand-950/95 backdrop-blur transition-colors">
      {/* Top Demo Notification & Role Switcher Bar */}
      <div className="bg-slate-900 text-slate-200 px-4 py-1.5 text-xs flex items-center justify-between flex-wrap gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 uppercase tracking-wider">
            Demo Persona Switcher
          </span>
          <span className="hidden sm:inline text-slate-400">
            Currently viewing as:
          </span>
          <span className="font-semibold text-white flex items-center gap-1.5">
            <span>{config.icon}</span>
            <span>{config.label}</span>
            <span className="text-slate-400 text-[11px] hidden md:inline font-normal">({config.title})</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-[11px] hidden lg:inline mr-1">Switch View:</span>
          {Object.entries(ROLE_CONFIGS).map(([roleKey, rConfig]) => (
            <button
              key={roleKey}
              onClick={() => switchRole(roleKey)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                currentRole === roleKey
                  ? 'bg-brand-500 text-white shadow-sm ring-1 ring-white/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              title={`Switch to ${rConfig.label} interface`}
            >
              <span className="mr-1">{rConfig.icon}</span>
              <span className="hidden sm:inline">{rConfig.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Navbar */}
      <div className="flex items-center justify-between px-4 sm:px-6 h-15">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-brand-800 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(config.dashboardPath)} className="flex items-center gap-2.5">
              <Logo size={32} />
              <div className="text-left hidden sm:block">
                <span className="text-base font-bold text-slate-900 dark:text-white leading-none block">
                  Rx<span className="text-brand-500">Pulse</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase">
                  {config.title}
                </span>
              </div>
            </button>

            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badgeColor}`}>
              <span>{config.icon}</span>
              <span>{config.label} View</span>
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-brand-800 transition-colors"
            aria-label="Toggle dark mode"
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>

          {/* User Profile Menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-lg pl-2 pr-3 py-1.5 hover:bg-slate-100 dark:hover:bg-brand-800 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[140px]">
                  {user?.name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                  {config.label}
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-brand-800 bg-white dark:bg-brand-900 shadow-xl p-2 z-50">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-brand-800 mb-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-white truncate">{user?.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                  <div className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-semibold uppercase">
                    Role: {config.label}
                  </div>
                </div>

                <div className="px-1 py-1">
                  <button
                    onClick={() => { navigate(config.dashboardPath); setUserMenuOpen(false) }}
                    className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-brand-800 font-medium"
                  >
                    Go to {config.label} Dashboard
                  </button>
                  <button
                    onClick={logout}
                    className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-medium mt-1"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
