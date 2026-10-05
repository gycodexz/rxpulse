import { NavLink } from 'react-router-dom'
import { useAuth, ROLE_CONFIGS } from '../context/AuthContext'
import Logo from './Logo'

const ICONS = {
  dashboard: (
    <path d="M3 3h8v8H3zM13 3h8v5h-8zM13 12h8v9h-8zM3 15h8v6H3z" />
  ),
  alert: (
    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  ),
  check: (
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  drugs: (
    <path d="M10.5 20.5L3.5 13.5a5 5 0 117.07-7.07l7 7a5 5 0 01-7.07 7.07zM8.5 8.5l7 7" />
  ),
  inventory: (
    <path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" />
  ),
  clock: (
    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  distributions: (
    <path d="M3 12h18M3 6h18M3 18h12" />
  ),
  orders: (
    <path d="M9 2h6l1 4H8l1-4zM4 6h16l-1.5 14a2 2 0 01-2 2h-9a2 2 0 01-2-2L4 6z" />
  ),
  cart: (
    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  ),
  truck: (
    <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h10zm0 0h5l3 3v2a1 1 0 01-1 1h-1m-6-6h7" />
  ),
  box: (
    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  ),
  activity: (
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  ),
  institutions: (
    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  ),
  vendors: (
    <path d="M3 9l1.5-5h15L21 9M3 9v10a1 1 0 001 1h16a1 1 0 001-1V9M3 9h18M9 13h6" />
  ),
  users: (
    <path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M11 3a4 4 0 110 8 4 4 0 010-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  ),
}

function Icon({ name }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {ICONS[name] || ICONS.dashboard}
    </svg>
  )
}

const ROLE_NAVIGATION = {
  admin: [
    { to: '/admin/dashboard', label: 'Executive Dashboard', icon: 'dashboard', desc: 'Crisis & shortages radar' },
    { to: '/admin/shortages', label: 'Shortages & Stock Radar', icon: 'alert', badge: 'Critical' },
    { to: '/admin/approvals', label: 'Purchase Approvals', icon: 'check' },
    { to: '/institutions', label: 'Regional Hospitals', icon: 'institutions' },
    { to: '/vendors', label: 'Pharma Suppliers', icon: 'vendors' },
    { to: '/users', label: 'User Governance', icon: 'users' },
  ],
  pharmacist: [
    { to: '/pharmacist/dashboard', label: 'Pharmacy Overview', icon: 'dashboard' },
    { to: '/pharmacist/drugs', label: 'Drug Master Catalog', icon: 'drugs', desc: 'Clinical salt specs' },
    { to: '/pharmacist/inventory', label: 'Stock In/Out Ledger', icon: 'inventory' },
    { to: '/pharmacist/expiry-quarantine', label: 'Expiry & Quarantine', icon: 'clock', badge: 'Alerts' },
    { to: '/pharmacist/distributions', label: 'Hospital Dispatches', icon: 'distributions' },
    { to: '/pharmacist/orders', label: 'Vendor Orders (POs)', icon: 'orders' },
  ],
  vendor: [
    { to: '/vendor/dashboard', label: 'Supplier Portal', icon: 'dashboard' },
    { to: '/vendor/supply-cart', label: 'Medicine Supply Cart', icon: 'cart', badge: 'Supply' },
    { to: '/vendor/orders', label: 'Order Fulfillment', icon: 'truck' },
    { to: '/vendor/products', label: 'My Product Catalog', icon: 'drugs' },
  ],
  institution_staff: [
    { to: '/staff/dashboard', label: 'Dispensary Station', icon: 'dashboard' },
    { to: '/staff/requisition', label: 'Drug Requisition Cart', icon: 'cart', badge: 'Order' },
    { to: '/staff/deliveries', label: 'Inbound Shipments', icon: 'box' },
    { to: '/staff/dispense', label: 'Ward Dispensing Log', icon: 'activity' },
  ],
}

const ROLE_ACCENT_STYLES = {
  admin: {
    sidebarHeader: 'border-slate-800 bg-slate-900 text-white',
    activeLink: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 shadow-sm',
    badge: 'bg-red-500/20 text-red-400 border border-red-500/30',
  },
  pharmacist: {
    sidebarHeader: 'border-emerald-800 bg-emerald-950 text-white',
    activeLink: 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-sm',
    badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  },
  vendor: {
    sidebarHeader: 'border-indigo-800 bg-indigo-950 text-white',
    activeLink: 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-slate-950 shadow-sm',
    badge: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  },
  institution_staff: {
    sidebarHeader: 'border-sky-800 bg-sky-950 text-white',
    activeLink: 'bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-950 shadow-sm',
    badge: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  },
}

export default function RoleSidebar({ open, onClose }) {
  const { user } = useAuth()
  const role = user?.role || 'admin'
  const config = ROLE_CONFIGS[role] || ROLE_CONFIGS.admin
  const links = ROLE_NAVIGATION[role] || ROLE_NAVIGATION.admin
  const styles = ROLE_ACCENT_STYLES[role] || ROLE_ACCENT_STYLES.admin

  return (
    <>
      {open && <div onClick={onClose} className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" />}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-68 shrink-0 border-r border-slate-200 dark:border-brand-800
        bg-white dark:bg-brand-950 transition-transform duration-200 lg:translate-x-0 flex flex-col
        ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Role Header Banner */}
        <div className={`p-4 border-b ${styles.sidebarHeader} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <div className="font-bold text-sm tracking-wide text-white">{config.label}</div>
              <div className="text-[11px] text-slate-300 truncate max-w-[170px]">{config.title}</div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Section */}
        <div className="p-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 px-4 pt-4">
          {config.label} Navigation
        </div>

        <nav className="p-3 space-y-1.5 overflow-y-auto flex-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all group ${
                  isActive
                    ? styles.activeLink
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-brand-900/60'
                }`
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon name={link.icon} />
                <span className="truncate">{link.label}</span>
              </div>
              {link.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${styles.badge}`}>
                  {link.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Role Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-brand-800/80 bg-slate-50 dark:bg-brand-900/40">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>RxPulse Enterprise</span>
            <span className="font-mono text-[10px]">v2.1</span>
          </div>
        </div>
      </aside>
    </>
  )
}
