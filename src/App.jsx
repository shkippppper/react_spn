import { Routes, Route, NavLink } from 'react-router-dom'
import Leaderboard from './pages/Leaderboard'
import Players from './pages/Players'
import Games from './pages/Games'
import LogGame from './pages/LogGame'

export default function App() {
  return (
    <>
      <nav>
        <NavLink to="/" className="logo">
          <span className="spade">♠</span> SPN
        </NavLink>
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
            Leaderboard
          </NavLink>
          <NavLink to="/players" className={({ isActive }) => isActive ? 'active' : ''}>
            Players
          </NavLink>
          <NavLink to="/games" className={({ isActive }) => isActive ? 'active' : ''}>
            Games
          </NavLink>
          <NavLink to="/log" className={({ isActive }) => isActive ? 'active' : ''}>
            Log Game
          </NavLink>
        </div>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Leaderboard />} />
          <Route path="/players" element={<Players />} />
          <Route path="/games" element={<Games />} />
          <Route path="/log" element={<LogGame />} />
        </Routes>
      </main>
    </>
  )
}
