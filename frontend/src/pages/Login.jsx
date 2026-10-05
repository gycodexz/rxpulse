import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, ROLE_CONFIGS } from '../context/AuthContext'
import Logo from '../components/Logo'
import Alert from '../components/Alert'

const DEMO_PERSONAS = [
  { role: 'admin', label: 'Administrator', icon: '🏛️', email: 'admin@rxpulse.org' },
  { role: 'pharmacist', label: 'Pharmacist', icon: '💊', email: 'pharmacist@rxpulse.org' },
  { role: 'vendor', label: 'Vendor Supplier', icon: '🚚', email: 'vendor@rxpulse.org' },
  { role: 'institution_staff', label: 'Hospital Staff', icon: '🏥', email: 'staff@rxpulse.org' },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, switchRole } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
    } catch (e) {
      setError(e.response?.data?.detail || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoSignIn = async (role) => {
    try {
      await switchRole(role)
    } catch {
      // Handled in switchRole fallback
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-brand-950 dark:via-brand-900 dark:to-brand-950 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size={48} />
        </div>
        <div className="card p-8 shadow-xl">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Welcome to RxPulse</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Multi-role pharmaceutical inventory & supply-chain platform
          </p>

          {error && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError('')} /></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-text">Email address</label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@hospital.com"
              />
            </div>
            <div>
              <label className="label-text">Password</label>
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full shadow-md">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Quick Demo Sign In Pills */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-brand-800">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              1-Click Demo Persona Sign In
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_PERSONAS.map((p) => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => handleDemoSignIn(p.role)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-brand-800 hover:border-brand-500 dark:hover:border-brand-500 text-left text-xs bg-slate-50/50 dark:bg-brand-900/40 hover:bg-white transition-all group"
                >
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-white">
                    <span>{p.icon}</span>
                    <span className="truncate group-hover:text-brand-600">{p.label}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{p.email}</div>
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 dark:text-brand-300 font-medium hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
