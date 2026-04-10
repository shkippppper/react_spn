import { useState, useEffect } from 'react'
import { getLeaderboard } from '../store'

function RankingColumn({ title, players, valueKey, formatValue, accentColor }) {
  const top = players[0]
  const rest = players.slice(1)

  return (
    <div className="ranking-column">
      <div className="ranking-header" style={{ borderColor: accentColor }}>
        <span className="ranking-category">{title}</span>
      </div>

      {top ? (
        <div className="ranking-champion">
          <div className="ranking-champion-avatar">
            <img src="/crown.png" alt="Crown" className="ranking-crown" />
            <div className="avatar ranking-avatar-lg">
              {top.avatar
                ? <img src={top.avatar} alt={top.name} />
                : top.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <h3 className="ranking-champion-name">{top.name.toUpperCase()}</h3>
          {top.nickname && <span className="ranking-champion-nickname">"{top.nickname}"</span>}
          <span className="ranking-champion-value">{formatValue(top[valueKey])}</span>
        </div>
      ) : (
        <div className="ranking-champion ranking-empty">
          <span style={{ color: 'var(--cream-dim)', fontStyle: 'italic' }}>No data yet</span>
        </div>
      )}

      <div className="ranking-list">
        {rest.map((p, i) => (
          <div key={p.id} className="ranking-row">
            <span className="ranking-pos">{i + 2}</span>
            <div className="avatar ranking-avatar-sm">
              {p.avatar
                ? <img src={p.avatar} alt={p.name} />
                : p.name.charAt(0).toUpperCase()}
            </div>
            <span className="ranking-name">{p.name}</span>
            <span className="ranking-value">{formatValue(p[valueKey])}</span>
          </div>
        ))}
        {rest.length === 0 && top && (
          <div className="ranking-row" style={{ justifyContent: 'center', color: 'var(--cream-dim)', fontStyle: 'italic' }}>
            No other players yet
          </div>
        )}
      </div>
    </div>
  )
}

export default function Rankings() {
  const [data, setData] = useState({ points: [], money: [], wins: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const board = await getLeaderboard()
      const active = board.filter(p => p.gamesPlayed > 0)

      const byPoints = [...active].sort((a, b) => b.points - a.points)
      const byMoney = [...active].sort((a, b) => b.profit - a.profit)
      const byWins = [...active].sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins
        return b.points - a.points
      })

      setData({ points: byPoints, money: byMoney, wins: byWins })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="empty-state"><p>Loading...</p></div>

  const noData = data.points.length === 0

  return (
    <>
      <h1>Rankings</h1>
      <p className="subtitle">The definitive measure of every player at the table</p>

      {noData ? (
        <div className="empty-state">
          <div className="icon">♔</div>
          <p>No games played yet. Rankings will appear after the first game.</p>
        </div>
      ) : (
        <div className="rankings-grid">
          <RankingColumn
            title="Most Points"
            players={data.points}
            valueKey="points"
            formatValue={v => `${v} pts`}
            accentColor="#c9a84c"
          />
          <RankingColumn
            title="Most Money Won"
            players={data.money}
            valueKey="profit"
            formatValue={v => `${v >= 0 ? '+' : ''}${v}₾`}
            accentColor="#3d8e6e"
          />
          <RankingColumn
            title="Most Wins"
            players={data.wins}
            valueKey="wins"
            formatValue={v => `${v} ${v === 1 ? 'win' : 'wins'}`}
            accentColor="#e8d48b"
          />
        </div>
      )}
    </>
  )
}
