import { useState, useEffect } from 'react'
import { getGames, getPlayers, removeGame } from '../store'
import { Link } from 'react-router-dom'

export default function Games() {
  const [games, setGames] = useState([])
  const [players, setPlayers] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [g, p] = await Promise.all([getGames(), getPlayers()])
      const map = {}
      p.forEach(pl => { map[pl.id] = pl })
      setPlayers(map)
      setGames(g)
      setLoading(false)
    }
    load()
  }, [])

  async function handleRemove(id) {
    if (!confirm('Delete this game record?')) return
    try {
      await removeGame(id)
      setGames(await getGames())
    } catch (err) {
      alert('Failed to delete: ' + err.message)
    }
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) return <div className="empty-state"><p>Loading...</p></div>

  return (
    <>
      <h1>Game History</h1>
      <p className="subtitle">A chronicle of every hand dealt in Surami</p>

      {games.length === 0 ? (
        <div className="empty-state">
          <div className="icon">♥</div>
          <p>No games recorded yet.</p>
          <p style={{ marginTop: '0.5rem' }}>
            <Link to="/log" style={{ color: 'var(--gold)' }}>Log your first game</Link>
          </p>
        </div>
      ) : (
        games.map(game => {
          const gameBuyIn = game.buyIn || 0
          const totalPot = game.results.reduce(
            (sum, r) => sum + gameBuyIn + (r.rebuy ? gameBuyIn : 0), 0
          )
          return (
            <div key={game.id} className="game-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="game-date">{formatDate(game.date)}</span>
                  {gameBuyIn > 0 && (
                    <span style={{ marginLeft: '1rem', color: 'var(--gold-dim)', fontSize: '0.85rem' }}>
                      Buy-in: {gameBuyIn} | Pot: {totalPot}
                    </span>
                  )}
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleRemove(game.id)}
                >
                  Delete
                </button>
              </div>
              <div className="game-results">
                {game.results
                  .sort((a, b) => a.position - b.position)
                  .map(r => {
                    const player = players[r.playerId]
                    return (
                      <div key={r.playerId} className="game-result-chip">
                        <span className={`position pos-${r.position <= 3 ? r.position : ''}`}>
                          #{r.position}
                        </span>
                        <span>{player?.name || 'Unknown'}</span>
                        {r.rebuy && (
                          <span className="rebuy-badge">R</span>
                        )}
                      </div>
                    )
                  })}
              </div>
              {game.notes && (
                <p style={{ marginTop: '0.6rem', fontStyle: 'italic', color: 'var(--cream-dim)', fontSize: '0.9rem' }}>
                  {game.notes}
                </p>
              )}
            </div>
          )
        })
      )}
    </>
  )
}
