import { supabase } from './supabase'

// ── Players ──

export async function getPlayers() {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('created_at')
  if (error) throw error
  return data
}

export async function addPlayer({ name, nickname, avatar }) {
  const { data, error } = await supabase
    .from('players')
    .insert({ name: name.trim(), nickname: nickname?.trim() || '', avatar: avatar || null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removePlayer(id) {
  const { error } = await supabase.from('players').delete().eq('id', id)
  if (error) throw error
}

// ── Games ──

export async function getGames() {
  const { data, error } = await supabase
    .from('games')
    .select(`*, game_results(*)`)
    .order('date', { ascending: false })
  if (error) throw error
  return data.map(g => ({
    ...g,
    buyIn: g.buy_in || 0,
    results: g.game_results.map(r => ({
      playerId: r.player_id,
      position: r.position,
      rebuy: r.rebuy || false,
      buyIn: r.buy_in,
      cashOut: r.cash_out,
    })),
  }))
}

export async function addGame({ date, buyIn, results, notes }) {
  const { data: game, error: gameErr } = await supabase
    .from('games')
    .insert({ date, buy_in: buyIn || 0, notes: notes || '' })
    .select()
    .single()
  if (gameErr) throw gameErr

  const rows = results.map(r => ({
    game_id: game.id,
    player_id: r.playerId,
    position: r.position,
    rebuy: r.rebuy || false,
    buy_in: r.buyIn || 0,
    cash_out: r.cashOut || 0,
  }))
  const { error: resErr } = await supabase.from('game_results').insert(rows)
  if (resErr) throw resErr

  return game
}

export async function removeGame(id) {
  // game_results deleted by cascade
  const { error } = await supabase.from('games').delete().eq('id', id)
  if (error) throw error
}

// ── Leaderboard (computed from data) ──

export async function getLeaderboard() {
  const [players, games] = await Promise.all([getPlayers(), getGames()])

  const stats = {}
  players.forEach(p => {
    stats[p.id] = {
      ...p,
      gamesPlayed: 0,
      wins: 0,
      topThree: 0,
      totalBuyIn: 0,
      totalCashOut: 0,
      profit: 0,
      points: 0,
      rebuys: 0,
    }
  })

  games.forEach(game => {
    const playerCount = game.results.length
    const gameBuyIn = game.buyIn || 0

    game.results.forEach(r => {
      if (!stats[r.playerId]) return
      const s = stats[r.playerId]
      s.gamesPlayed++

      const playerBuyIn = gameBuyIn + (r.rebuy ? gameBuyIn : 0)
      s.totalBuyIn += playerBuyIn
      s.totalCashOut += r.cashOut || 0
      s.profit = s.totalCashOut - s.totalBuyIn
      if (r.rebuy) s.rebuys++

      if (r.position === 1) {
        s.wins++
        s.points += 10
      } else if (r.position === 2) {
        s.points += 7
      } else if (r.position === 3) {
        s.points += 5
      } else {
        s.points += Math.max(1, playerCount - r.position)
      }
      if (r.position <= 3) s.topThree++
    })
  })

  return Object.values(stats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.wins !== a.wins) return b.wins - a.wins
    return b.profit - a.profit
  })
}
