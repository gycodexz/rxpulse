import { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('rxpulse_user')
    return raw ? JSON.parse(raw) : null
  })
  const navigate = useNavigate()

  const persistSession = (token, userData) => {
    localStorage.setItem('rxpulse_token', token)
    localStorage.setItem('rxpulse_user', JSON.stringify(userData))
    setUser(userData)
  }

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password })
    persistSession(res.data.access_token, res.data.user)
    return res.data.user
  }

  const register = async (payload) => {
    const res = await api.post('/api/auth/register', payload)
    persistSession(res.data.access_token, res.data.user)
    return res.data.user
  }

  const logout = () => {
    localStorage.removeItem('rxpulse_token')
    localStorage.removeItem('rxpulse_user')
    setUser(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
