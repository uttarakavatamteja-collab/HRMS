import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('hrms_token')
    const savedUser = localStorage.getItem('hrms_user')
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, user: userData } = res.data.data
    localStorage.setItem('hrms_token', token)
    localStorage.setItem('hrms_user', JSON.stringify(userData))
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(userData)
    return userData
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch {}
    localStorage.removeItem('hrms_token')
    localStorage.removeItem('hrms_user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  const isAdmin = () => user?.role === 'admin'
  const isHR = () => ['admin', 'hr'].includes(user?.role)
  const isManager = () => ['admin', 'hr', 'manager'].includes(user?.role)

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isHR, isManager }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
