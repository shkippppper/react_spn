import { useState, useEffect } from 'react'
import { getPlayers, addGame } from '../store'
import { useNavigate } from 'react-router-dom'

const emptyResult = () => ({ playerId: '', position: '', rebuy: false })

export default function LogGame() {
  const [players, setPlayers] = useState([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [buyIn, setBuyIn] = useState('')
  const [results, setResults] = useState([emptyResult(), emptyResult()])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getPlayers().then(p => { setPlayers(p); setLoading(false) })
  }, [])

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
      navigate('/games')
    } catch (err) {
      alert('Failed to log game: ' + err.message)
      setSubmitting(false)
    }
  }

  const usedPlayerIds = results.map(r => r.playerId).filter(Boolean)

  if (loading) return <div className="empty-state"><p>Loading...</p></div>

  return (
    <>
      <h1>Log Game</h1>
      <p className="subtitle">Record the deeds of the evening</p>

      {players.length < 2 ? (
        <div className="empty-state">
          <div className="icon">♦</div>
          <p>Register at least 2 players first.</p>
        </div>
      ) : (
        <div className="card">
          <form onSubmit={handleSubmit}>
            {/* ── Game Setup ── */}
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
                    <span className="pot-value">{totalPot}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Players ── */}
            <h2 style={{ marginTop: '1.5rem' }}>Players</h2>

            <div className="player-results-list">
              {results.map((r, i) => {
                const player = players.find(p => p.id === r.playerId)
                return (
                  <div key={i} className="player-result-row">
                    <div className="player-result-main">
                      <div className="form-group" style={{ flex: 2, minWidth: '150px' }}>
                        <label>Player</label>
                        <select
                          value={r.playerId}
                          onChange={e => updateResult(i, 'playerId', e.target.value)}
                        >
                          <option value="">Select player...</option>
                          {players.map(p => (
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

                      <div className="form-group" style={{ width: '80px', flexShrink: 0 }}>
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
                          title={r.rebuy ? 'Rebuy used' : 'No rebuy'}
                        >
                          <span className="chip-icon">♠</span>
                          <span className="chip-text">{r.rebuy ? 'Used' : 'No'}</span>
                        </button>
                      </div>

                      {results.length > 2 && (
                        <button type="button" className="remove-row" onClick={() => removeRow(i)}>
                          ×
                        </button>
                      )}
                    </div>

                    {r.playerId && buyInNum > 0 && (
                      <div className="player-cost-line">
                        Cost: {buyInNum}{r.rebuy ? ` + ${buyInNum} rebuy = ${buyInNum * 2}` : ''}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <button type="button" className="add-row-btn" onClick={addRow}>
              + Add Player
            </button>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Notable hands, bad beats, legendary bluffs..."
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Recording...' : 'Record Game'}
            </button>
          </form>
        </div>
      )}
    </>
  )
}
