import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext({ isAdmin: false, login: async () => {}, logout: () => {} })

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('spn_admin') === '1')

  const login = useCallback(async (username, password) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (data.ok) {
      sessionStorage.setItem('spn_admin', '1')
      setIsAdmin(true)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('spn_admin')
    setIsAdmin(false)
  }, [])

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
