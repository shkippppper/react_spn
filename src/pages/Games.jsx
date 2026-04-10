import { useState, useEffect } from 'react'
import { getGames, getPlayers, removeGame, addGame } from '../store'
import { useAuth } from '../AuthContext'

const emptyResult = () => ({ playerId: '', position: '', rebuy: false })

export default function Games() {
  const { isAdmin } = useAuth()
  const [games, setGames] = useState([])
  const [players, setPlayers] = useState({})
  const [playersList, setPlayersList] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [showModal, setShowModal] = useState(false)

  // Modal form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [buyIn, setBuyIn] = useState('')
  const [results, setResults] = useState([emptyResult(), emptyResult()])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      const [g, p] = await Promise.all([getGames(), getPlayers()])
      const map = {}
      p.forEach(pl => { map[pl.id] = pl })
      setPlayers(map)
      setPlayersList(p)
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

  // ── Modal helpers ──
  function openModal() {
    setDate(new Date().toISOString().split('T')[0])
    setBuyIn('')
    setResults([emptyResult(), emptyResult()])
    setNotes('')
    setSubmitting(false)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
  }

  function updateResult(i, field, value) {
    const updated = [...results]
    updated[i] = { ...updated[i], [field]: value }
    setResults(updated)
  }

  function addRow() {
    setResults([...results, emptyResult()])
  }

  function removeRow(i) {
    if (results.length <= 2) return
    setResults(results.filter((_, idx) => idx !== i))
  }

  const buyInNum = parseFloat(buyIn) || 0
  const validPlayers = results.filter(r => r.playerId)
  const totalPot = validPlayers.reduce((sum, r) => sum + buyInNum + (r.rebuy ? buyInNum : 0), 0)
  const usedPlayerIds = results.map(r => r.playerId).filter(Boolean)

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return

    if (!buyInNum || buyInNum <= 0) {
      alert('Set a buy-in amount')
      return
    }

    const validResults = results
      .filter(r => r.playerId && r.position)
      .map(r => ({
        playerId: r.playerId,
        position: parseInt(r.position),
        rebuy: r.rebuy,
        buyIn: buyInNum + (r.rebuy ? buyInNum : 0),
        cashOut: 0,
      }))

    if (validResults.length < 2) {
      alert('At least 2 players with positions needed')
      return
    }

    setSubmitting(true)
    try {
      await addGame({ date, buyIn: buyInNum, results: validResults, notes })
      setGames(await getGames())
      closeModal()
    } catch (err) {
      alert('Failed to log game: ' + err.message)
      setSubmitting(false)
    }
  }

  if (loading) return <div className="empty-state"><p>Loading...</p></div>

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
        <h1>Game History</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openModal}>
            + Log Game
          </button>
        )}
      </div>
      <p className="subtitle">A chronicle of every hand dealt in Surami</p>

      {games.length === 0 ? (
        <div className="empty-state">
          <div className="icon">♥</div>
          <p>No games recorded yet.</p>
          {isAdmin && (
            <p style={{ marginTop: '0.5rem' }}>
              <button onClick={openModal} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', textDecoration: 'underline' }}>
                Log your first game
              </button>
            </p>
          )}
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
              <div className="game-header">
                <div className="game-header-left">
                  {winnerPlayer && (
                    <div className="game-winner-avatar">
                      <img src="/crown.png" alt="Crown" className="game-crown" />
                      <div className="avatar">
                        {winnerPlayer.avatar
                          ? <img src={winnerPlayer.avatar} alt={winnerPlayer.name} />
                          : winnerPlayer.name.charAt(0).toUpperCase()}
                      </div>
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

              {isOpen && (
                <div className="game-expanded" onClick={e => e.stopPropagation()}>
                  <div className="game-expanded-divider" />
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
                          <div className="expanded-avatar-wrap">
                            {r.position === 1 && <img src="/crown.png" alt="Crown" className="expanded-crown" />}
                            <div className="avatar" style={{ width: 36, height: 36, fontSize: '0.9rem' }}>
                              {player?.avatar
                                ? <img src={player.avatar} alt={player?.name} />
                                : (player?.name?.charAt(0).toUpperCase() || '?')}
                            </div>
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
                  {isAdmin && (
                    <div style={{ marginTop: '0.8rem', textAlign: 'right' }}>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={(e) => { e.stopPropagation(); handleRemove(game.id) }}
                      >
                        Delete Game
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })
      )}

      {/* ── LOG GAME MODAL ── */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ margin: 0 }}>Log Game</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            {playersList.length < 2 ? (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <div className="icon">♦</div>
                <p>Register at least 2 players first.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="game-setup">
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
                    <div className="form-group" style={{ maxWidth: 200 }}>
                      <label>Date</label>
                      <input type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ maxWidth: 200 }}>
                      <label>Buy-in Amount</label>
                      <div className="buy-in-input">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={buyIn}
                          onChange={e => setBuyIn(e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>
                    {buyInNum > 0 && (
                      <div className="pot-display">
                        <span className="pot-label">Total Pot</span>
                        <span className="pot-value">{totalPot}₾</span>
                      </div>
                    )}
                  </div>
                </div>

                <h2 style={{ marginTop: '1rem', fontSize: '1.2rem' }}>Players</h2>

                <div className="player-results-list">
                  {results.map((r, i) => (
                    <div key={i} className="player-result-row">
                      <div className="player-result-main">
                        <div className="form-group" style={{ flex: 2, minWidth: '140px' }}>
                          <label>Player</label>
                          <select
                            value={r.playerId}
                            onChange={e => updateResult(i, 'playerId', e.target.value)}
                          >
                            <option value="">Select...</option>
                            {playersList.map(p => (
                              <option
                                key={p.id}
                                value={p.id}
                                disabled={usedPlayerIds.includes(p.id) && r.playerId !== p.id}
                              >
                                {p.name}{p.nickname ? ` "${p.nickname}"` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group" style={{ width: '70px', flexShrink: 0 }}>
                          <label>Finish</label>
                          <input
                            type="number"
                            min="1"
                            value={r.position}
                            onChange={e => updateResult(i, 'position', e.target.value)}
                            placeholder="#"
                          />
                        </div>
                        <div className="rebuy-container">
                          <label className="rebuy-label">Rebuy</label>
                          <button
                            type="button"
                            className={`rebuy-chip ${r.rebuy ? 'rebuy-active' : ''}`}
                            onClick={() => updateResult(i, 'rebuy', !r.rebuy)}
                          >
                            <span className="chip-icon">♠</span>
                            <span className="chip-text">{r.rebuy ? 'Used' : 'No'}</span>
                          </button>
                        </div>
                        {results.length > 2 && (
                          <button type="button" className="remove-row" onClick={() => removeRow(i)}>×</button>
                        )}
                      </div>
                      {r.playerId && buyInNum > 0 && (
                        <div className="player-cost-line">
                          Cost: {buyInNum}₾{r.rebuy ? ` + ${buyInNum}₾ rebuy = ${buyInNum * 2}₾` : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button type="button" className="add-row-btn" onClick={addRow}>+ Add Player</button>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Notable hands, bad beats, legendary bluffs..."
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%' }}>
                  {submitting ? 'Recording...' : 'Record Game'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
