import { Routes, Route, NavLink } from 'react-router-dom'
import Leaderboard from './pages/Leaderboard'
import Rankings from './pages/Rankings'
import Players from './pages/Players'
import Games from './pages/Games'

export default function App() {
  return (
    <>
      <nav>
        <NavLink to="/" className="logo">
          <span className="spade">♠</span> SPN
        </NavLink>
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
            Statistics
          </NavLink>
          <NavLink to="/rankings" className={({ isActive }) => isActive ? 'active' : ''}>
            Rankings
          </NavLink>
          <NavLink to="/players" className={({ isActive }) => isActive ? 'active' : ''}>
            Players
          </NavLink>
          <NavLink to="/games" className={({ isActive }) => isActive ? 'active' : ''}>
            Games
          </NavLink>
        </div>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Leaderboard />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/players" element={<Players />} />
          <Route path="/games" element={<Games />} />
        </Routes>
      </main>
    </>
  )
}
