import { useState, useEffect } from 'react'
import { getGames, getPlayers, removeGame } from '../store'
import { Link } from 'react-router-dom'

export default function Games() {
  const [games, setGames] = useState([])
  const [players, setPlayers] = useState({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})

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

  function toggleExpand(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

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
          const isOpen = expanded[game.id]
          const sorted = [...game.results].sort((a, b) => a.position - b.position)
          const winner = sorted.find(r => r.position === 1)
          const winnerPlayer = winner ? players[winner.playerId] : null

          return (
            <div
              key={game.id}
              className={`game-card game-card-expandable ${isOpen ? 'game-card-open' : ''}`}
              onClick={() => toggleExpand(game.id)}
            >
              {/* ── Collapsed View ── */}
              <div className="game-header">
                <div className="game-header-left">
                  {winnerPlayer && (
                    <div className="game-winner-avatar">
                      <div className="avatar">
                        {winnerPlayer.avatar
                          ? <img src={winnerPlayer.avatar} alt={winnerPlayer.name} />
                          : winnerPlayer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="winner-crown">♛</div>
                    </div>
                  )}
                  <div className="game-header-info">
                    <span className="game-date">{formatDate(game.date)}</span>
                    <span className="game-header-summary">
                      {winnerPlayer?.name || 'Unknown'} won
                      {game.totalPot > 0 && <span className="game-pot-tag"> · Pot: {game.totalPot}₾</span>}
                      <span className="game-players-count"> · {game.results.length} players</span>
                    </span>
                  </div>
                </div>
                <div className="game-header-right">
                  <span className={`expand-arrow ${isOpen ? 'expand-arrow-open' : ''}`}>▾</span>
                </div>
              </div>

              {/* ── Expanded View ── */}
              {isOpen && (
                <div className="game-expanded" onClick={e => e.stopPropagation()}>
                  <div className="game-expanded-divider" />

                  {/* Stats bar */}
                  <div className="game-stats-bar">
                    <div className="game-stat">
                      <span className="game-stat-label">Buy-in</span>
                      <span className="game-stat-value">{game.buyIn}₾</span>
                    </div>
                    <div className="game-stat">
                      <span className="game-stat-label">Players</span>
                      <span className="game-stat-value">{game.results.length}</span>
                    </div>
                    <div className="game-stat">
                      <span className="game-stat-label">Rebuys</span>
                      <span className="game-stat-value">{game.results.filter(r => r.rebuy).length}</span>
                    </div>
                    <div className="game-stat">
                      <span className="game-stat-label">Total Pot</span>
                      <span className="game-stat-value game-stat-gold">{game.totalPot}₾</span>
                    </div>
                  </div>

                  {/* Player results */}
                  <div className="game-expanded-results">
                    {sorted.map(r => {
                      const player = players[r.playerId]
                      const profit = r.cashOut - r.buyIn
                      return (
                        <div key={r.playerId} className={`game-expanded-row ${r.position === 1 ? 'game-expanded-winner' : ''}`}>
                          <div className="game-expanded-pos">
                            <span className={`pos-${r.position <= 3 ? r.position : ''}`}>
                              #{r.position}
                            </span>
                          </div>
                          <div className="avatar" style={{ width: 36, height: 36, fontSize: '0.9rem' }}>
                            {player?.avatar
                              ? <img src={player.avatar} alt={player?.name} />
                              : (player?.name?.charAt(0).toUpperCase() || '?')}
                          </div>
                          <div className="game-expanded-player">
                            <span className="player-name" style={{ fontSize: '0.95rem' }}>{player?.name || 'Unknown'}</span>
                            {player?.nickname && <span className="player-nickname">"{player.nickname}"</span>}
                          </div>
                          <div className="game-expanded-details">
                            {r.rebuy && <span className="rebuy-badge">R</span>}
                            <span className="game-expanded-cost">In: {r.buyIn}₾</span>
                            {r.cashOut > 0 && <span className="game-expanded-won">Won: {r.cashOut}₾</span>}
                            <span className={`game-expanded-profit ${profit >= 0 ? 'stat-positive' : 'stat-negative'}`}>
                              {profit >= 0 ? '+' : ''}{profit}₾
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {game.notes && (
                    <div className="game-expanded-notes">
                      "{game.notes}"
                    </div>
                  )}

                  <div style={{ marginTop: '0.8rem', textAlign: 'right' }}>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={(e) => { e.stopPropagation(); handleRemove(game.id) }}
                    >
                      Delete Game
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}
    </>
  )
}
