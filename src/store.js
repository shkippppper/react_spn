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
  return data.map(g => {
    const gameBuyIn = g.buy_in || 0
    const results = g.game_results.map(r => ({
      playerId: r.player_id,
      position: r.position,
      rebuy: r.rebuy || false,
      buyIn: gameBuyIn + (r.rebuy ? gameBuyIn : 0),
      cashOut: 0,
    }))

    // Winner (position 1) gets the whole pot
    const totalPot = results.reduce((sum, r) => sum + r.buyIn, 0)
    const winner = results.find(r => r.position === 1)
    if (winner) winner.cashOut = totalPot

    return {
      ...g,
      buyIn: gameBuyIn,
      totalPot,
      results,
    }
  })
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
    cash_out: 0,
  }))
  const { error: resErr } = await supabase.from('game_results').insert(rows)
  if (resErr) throw resErr

  return game
}

export async function removeGame(id) {
  const { error } = await supabase.from('games').delete().eq('id', id)
  if (error) throw error
}

// ── SPN Point Table ──
// Total pool = playerCount * 20, last place always 0
const POINT_TABLE = {
  2:  [40, 0],
  3:  [40, 20, 0],
  4:  [36, 26, 18, 0],
  5:  [40, 28, 20, 12, 0],
  6:  [43, 30, 22, 13, 12, 0],
  7:  [48, 34, 24, 14, 13, 8, 0],
  8:  [56, 40, 29, 16, 10, 6, 3, 0],
  9:  [59, 41, 31, 18, 13, 9, 5, 4, 0],
  10: [64, 44, 32, 20, 16, 10, 6, 4, 4, 0],
  11: [68, 46, 33, 22, 18, 11, 9, 7, 4, 2, 0],
  12: [72, 50, 36, 24, 19, 12, 10, 7, 5, 3, 2, 0],
}

function getPoints(playerCount, position) {
  const table = POINT_TABLE[playerCount]
  if (!table) {
    // Fallback for >12 players: scale proportionally from 12-player table
    const base = POINT_TABLE[12]
    const ratio = (playerCount * 20) / 240
    if (position <= 12) return Math.round(base[position - 1] * ratio)
    return 0
  }
  return table[position - 1] ?? 0
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

    game.results.forEach(r => {
      if (!stats[r.playerId]) return
      const s = stats[r.playerId]
      s.gamesPlayed++
      s.totalBuyIn += r.buyIn
      s.totalCashOut += r.cashOut
      s.profit = s.totalCashOut - s.totalBuyIn
      if (r.rebuy) s.rebuys++

      s.points += getPoints(playerCount, r.position)
      if (r.position === 1) s.wins++
      if (r.position <= 3) s.topThree++
    })
  })

  return Object.values(stats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.wins !== a.wins) return b.wins - a.wins
    return b.profit - a.profit
  })
}
