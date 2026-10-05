import { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const AuthContext = createContext(null)

export const ROLE_CONFIGS = {
  admin: {
    label: 'Administrator',
    title: 'Central Health Authority',
    badgeColor: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-700',
    accentColor: 'from-slate-900 to-blue-900',
    dashboardPath: '/admin/dashboard',
    description: 'System governance, shortage radar, crisis response & PO approvals',
    icon: '🏛️',
  },
  pharmacist: {
    label: 'Pharmacist',
    title: 'Central Warehouse Pharmacy',
    badgeColor: 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950',
    accentColor: 'from-emerald-700 to-teal-900',
    dashboardPath: '/pharmacist/dashboard',
    description: 'Inventory custody, batch & expiry quarantine, clinical catalog, dispatches',
    icon: '💊',
  },
  vendor: {
    label: 'Vendor',
    title: 'Pharma Supplier Portal',
    badgeColor: 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-slate-950',
    accentColor: 'from-indigo-700 to-purple-900',
    dashboardPath: '/vendor/dashboard',
    description: 'B2B supply cart, quotes, active PO fulfillment & consignment tracking',
    icon: '🚚',
  },
  institution_staff: {
    label: 'Hospital Staff',
    title: 'Hospital Dispensary Station',
    badgeColor: 'bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-950',
    accentColor: 'from-sky-700 to-cyan-900',
    dashboardPath: '/staff/dashboard',
    description: 'Medicine indent requisition cart, inbound shipment receipt & ward dispensing',
    icon: '🏥',
  },
}

const DEFAULT_DEMO_USERS = {
  admin: {
    _id: 'usr_admin_01',
    name: 'Dr. Ananya Roy (Executive Health Director)',
    email: 'admin@rxpulse.org',
    role: 'admin',
    is_active: true,
  },
  pharmacist: {
    _id: 'usr_pharm_01',
    name: 'Vikram Sen (Chief Pharmacist)',
    email: 'pharmacist@rxpulse.org',
    role: 'pharmacist',
    is_active: true,
  },
  vendor: {
    _id: 'usr_vendor_01',
    name: 'Rajesh Kumar (Sun Pharma Logistics Lead)',
    email: 'vendor@rxpulse.org',
    role: 'vendor',
    is_active: true,
  },
  institution_staff: {
    _id: 'usr_staff_01',
    name: 'Sister Priya Sharma (Head Nurse, Apex Trauma)',
    email: 'staff@rxpulse.org',
    role: 'institution_staff',
    is_active: true,
  },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('rxpulse_user')
    // Default to admin demo user if no session exists yet, making initial launch instant
    return raw ? JSON.parse(raw) : DEFAULT_DEMO_USERS.admin
  })
  const navigate = useNavigate()

  const persistSession = (token, userData) => {
    localStorage.setItem('rxpulse_token', token)
    localStorage.setItem('rxpulse_user', JSON.stringify(userData))
    setUser(userData)
  }

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password })
      persistSession(res.data.access_token, res.data.user)
      const targetPath = ROLE_CONFIGS[res.data.user.role]?.dashboardPath || '/admin/dashboard'
      navigate(targetPath)
      return res.data.user
    } catch (err) {
      // If network fails in demo mode, check demo credentials
      for (const [r, u] of Object.entries(DEFAULT_DEMO_USERS)) {
        if (u.email === email) {
          persistSession('mock_jwt_token', u)
          navigate(ROLE_CONFIGS[r].dashboardPath)
          return u
        }
      }
      throw err
    }
  }

  const register = async (payload) => {
    const res = await api.post('/api/auth/register', payload)
    persistSession(res.data.access_token, res.data.user)
    const targetPath = ROLE_CONFIGS[res.data.user.role]?.dashboardPath || '/admin/dashboard'
    navigate(targetPath)
    return res.data.user
  }

  const switchRole = async (targetRole) => {
    if (!ROLE_CONFIGS[targetRole]) return

    try {
      const res = await api.post(`/api/auth/demo-switch?role=${targetRole}`)
      persistSession(res.data.access_token, res.data.user)
      navigate(ROLE_CONFIGS[targetRole].dashboardPath)
      return res.data.user
    } catch {
      // Fallback to client-side demo user switch
      const fallbackUser = DEFAULT_DEMO_USERS[targetRole]
      persistSession('mock_jwt_token_' + targetRole, fallbackUser)
      navigate(ROLE_CONFIGS[targetRole].dashboardPath)
      return fallbackUser
    }
  }

  const logout = () => {
    localStorage.removeItem('rxpulse_token')
    localStorage.removeItem('rxpulse_user')
    setUser(null)
    navigate('/login')
  }

  const getDashboardPath = (role = user?.role) => {
    return ROLE_CONFIGS[role]?.dashboardPath || '/admin/dashboard'
  }

  return (
    <AuthContext.Provider value={{ user, login, register, switchRole, logout, getDashboardPath }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
