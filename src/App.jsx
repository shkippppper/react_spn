import { useState } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import Rankings from './pages/Rankings'
import Leaderboard from './pages/Leaderboard'
import Players from './pages/Players'
import Games from './pages/Games'

function LoginModal({ onClose }) {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    const ok = await login(username, password)
    if (ok) {
      onClose()
    } else {
      setError('Invalid credentials')
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ margin: 0 }}>Admin Login</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username"
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>
          {error && (
            <p style={{ color: 'var(--red-light)', fontSize: '0.9rem', marginBottom: '1rem' }}>{error}</p>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  )
}

function AppInner() {
  const { isAdmin, logout } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  function handleNavClick() {
    setMenuOpen(false)
  }

  return (
    <>
      <nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <NavLink to="/" className="logo" onClick={handleNavClick}>
            <span className="spade">♠</span> SPN
          </NavLink>
          <button
            className={`admin-btn ${isAdmin ? 'admin-btn-active' : ''}`}
            onClick={() => isAdmin ? logout() : setShowLogin(true)}
            title={isAdmin ? 'Logged in — click to log out' : 'Admin login'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>

        <button
          className={`burger ${menuOpen ? 'burger-open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>

        <div className={`nav-links ${menuOpen ? 'nav-links-open' : ''}`}>
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''} onClick={handleNavClick}>
            Rankings
          </NavLink>
          <NavLink to="/statistics" className={({ isActive }) => isActive ? 'active' : ''} onClick={handleNavClick}>
            Statistics
          </NavLink>
          <NavLink to="/players" className={({ isActive }) => isActive ? 'active' : ''} onClick={handleNavClick}>
            Players
          </NavLink>
          <NavLink to="/games" className={({ isActive }) => isActive ? 'active' : ''} onClick={handleNavClick}>
            Games
          </NavLink>
        </div>

        {menuOpen && <div className="nav-backdrop" onClick={() => setMenuOpen(false)} />}
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Rankings />} />
          <Route path="/statistics" element={<Leaderboard />} />
          <Route path="/players" element={<Players />} />
          <Route path="/games" element={<Games />} />
        </Routes>
      </main>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
