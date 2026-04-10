import { useState, useEffect } from 'react'
import { getPlayers, addGame } from '../store'
import { useNavigate } from 'react-router-dom'

const emptyResult = () => ({ playerId: '', position: '', buyIn: '', cashOut: '' })

export default function LogGame() {
  const [players, setPlayers] = useState([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
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

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return

    const validResults = results
      .filter(r => r.playerId && r.position)
      .map(r => ({
        playerId: r.playerId,
        position: parseInt(r.position),
        buyIn: parseFloat(r.buyIn) || 0,
        cashOut: parseFloat(r.cashOut) || 0,
      }))

    if (validResults.length < 2) {
      alert('At least 2 players needed')
      return
    }

    setSubmitting(true)
    try {
      await addGame({ date, results: validResults, notes })
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
            <div className="form-group" style={{ maxWidth: 220 }}>
              <label>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>

            <h2 style={{ marginTop: '1rem' }}>Results</h2>

            {results.map((r, i) => (
              <div key={i} className="result-row">
                <div className="form-group">
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
                <div className="form-group">
                  <label>Position</label>
                  <input
                    type="number"
                    min="1"
                    value={r.position}
                    onChange={e => updateResult(i, 'position', e.target.value)}
                    placeholder="#"
                  />
                </div>
                <div className="form-group">
                  <label>Buy-in</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={r.buyIn}
                    onChange={e => updateResult(i, 'buyIn', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>Cash Out</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={r.cashOut}
                    onChange={e => updateResult(i, 'cashOut', e.target.value)}
                    placeholder="0"
                  />
                </div>
                {results.length > 2 && (
                  <button type="button" className="remove-row" onClick={() => removeRow(i)}>
                    ×
                  </button>
                )}
              </div>
            ))}

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
