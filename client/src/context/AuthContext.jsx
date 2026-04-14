import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'
import { connectSocket, disconnectSocket } from '../utils/socket'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [player, setPlayer]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.get('/auth/me')
        .then(res => { setPlayer(res.data.player); connectSocket(token) })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', res.data.token)
    setPlayer(res.data.player)
    connectSocket(res.data.token)
    return res.data
  }

  const register = async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password })
    localStorage.setItem('token', res.data.token)
    setPlayer(res.data.player)
    connectSocket(res.data.token)
    return res.data
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch (_) {}
    localStorage.removeItem('token')
    disconnectSocket()
    setPlayer(null)
  }

  return (
    <AuthContext.Provider value={{ player, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
