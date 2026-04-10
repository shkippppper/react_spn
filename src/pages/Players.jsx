import { useState, useEffect } from 'react'
import { getPlayers, addPlayer, removePlayer } from '../store'
import { useAuth } from '../AuthContext'

export default function Players() {
  const { isAdmin } = useAuth()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // Modal form state
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarData, setAvatarData] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getPlayers().then(p => { setPlayers(p); setLoading(false) })
  }, [])

  function openModal() {
    setName('')
    setNickname('')
    setAvatarData(null)
    setAvatarPreview(null)
    setSubmitting(false)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
  }

  function handleAvatar(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setAvatarData(ev.target.result)
      setAvatarPreview(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || submitting) return
    setSubmitting(true)
    try {
      await addPlayer({ name: name.trim(), nickname: nickname.trim(), avatar: avatarData })
      setPlayers(await getPlayers())
      closeModal()
    } catch (err) {
      alert('Failed to add player: ' + err.message)
    }
    setSubmitting(false)
  }

  async function handleRemove(id) {
    if (!confirm('Remove this player?')) return
    try {
      await removePlayer(id)
      setPlayers(await getPlayers())
    } catch (err) {
      alert('Failed to remove: ' + err.message)
    }
  }

  if (loading) return <div className="empty-state"><p>Loading...</p></div>

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
        <h1>Players</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openModal}>
            + Add Player
          </button>
        )}
      </div>
      <p className="subtitle">The gentlemen of the table</p>

      {players.length === 0 ? (
        <div className="empty-state">
          <div className="icon">♣</div>
          <p>No players registered yet.</p>
          {isAdmin && (
            <p style={{ marginTop: '0.5rem' }}>
              <button onClick={openModal} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', textDecoration: 'underline' }}>
                Register your first player
              </button>
            </p>
          )}
        </div>
      ) : (
        <div className="players-grid">
          {players.map(p => (
            <div key={p.id} className="player-card">
              <div className="avatar">
                {p.avatar
                  ? <img src={p.avatar} alt={p.name} />
                  : p.name.charAt(0).toUpperCase()}
              </div>
              <div className="player-name">{p.name}</div>
              {p.nickname && <div className="player-nickname">"{p.nickname}"</div>}
              {isAdmin && (
                <button className="remove-btn" onClick={() => handleRemove(p.id)}>
                  remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── ADD PLAYER MODAL ── */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ margin: 0 }}>Register New Player</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 2, minWidth: '200px' }}>
                  <label>Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Full name"
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                  <label>Nickname</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    placeholder="Table alias"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Avatar Photo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {avatarPreview && (
                    <div className="avatar" style={{ width: 56, height: 56 }}>
                      <img src={avatarPreview} alt="preview" />
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleAvatar} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%' }}>
                {submitting ? 'Registering...' : 'Register Player'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
