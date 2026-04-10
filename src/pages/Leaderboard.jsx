import { useState, useEffect } from 'react'
import { getLeaderboard, getGames, getPlayers } from '../store'

export default function Leaderboard() {
  const [board, setBoard] = useState([])
  const [totalGames, setTotalGames] = useState(0)
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [lb, games, players] = await Promise.all([
        getLeaderboard(),
        getGames(),
        getPlayers(),
      ])
      setBoard(lb)
      setTotalGames(games.length)
      setTotalPlayers(players.length)
      setLoading(false)
    }
    load()
  }, [])

  const activePlayers = board.filter(p => p.gamesPlayed > 0)

  if (loading) return <div className="empty-state"><p>Loading...</p></div>

  return (
    <>
      <div className="hero">
        <h1>Surami Poker Night</h1>
        <p className="tagline">Where fortunes are won and friendships are tested</p>
        <div className="divider" />
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{totalPlayers}</div>
          <div className="stat-label">Players</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalGames}</div>
          <div className="stat-label">Games Played</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {activePlayers.length > 0 ? activePlayers[0]?.name?.split(' ')[0] || '—' : '—'}
          </div>
          <div className="stat-label">Current Leader</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {activePlayers.reduce((max, p) => Math.max(max, p.wins), 0)}
          </div>
          <div className="stat-label">Most Wins</div>
        </div>
      </div>

      <h2>Standings</h2>

      {activePlayers.length === 0 ? (
        <div className="empty-state">
          <div className="icon">♠</div>
          <p>No games have been played yet.</p>
          <p>Register some players and log your first game!</p>
        </div>
      ) : (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>GP</th>
              <th>Wins</th>
              <th>Top 3</th>
              <th>Profit</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {activePlayers.map((p, i) => (
              <tr key={p.id} className={i < 3 ? `rank-${i + 1}` : ''}>
                <td>{i + 1}</td>
                <td>
                  <div className="player-cell">
                    <div className="avatar">
                      {p.avatar
                        ? <img src={p.avatar} alt={p.name} />
                        : p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="player-name">{p.name}</div>
                      {p.nickname && <div className="player-nickname">"{p.nickname}"</div>}
                    </div>
                  </div>
                </td>
                <td>{p.gamesPlayed}</td>
                <td>{p.wins}</td>
                <td>{p.topThree}</td>
                <td className={p.profit >= 0 ? 'stat-positive' : 'stat-negative'}>
                  {p.profit >= 0 ? '+' : ''}{p.profit}
                </td>
                <td className="stat-points">{p.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
