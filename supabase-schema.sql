-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  nickname TEXT DEFAULT '',
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Game results (links players to games)
CREATE TABLE game_results (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),
  position INTEGER NOT NULL,
  buy_in REAL DEFAULT 0,
  cash_out REAL DEFAULT 0
);

-- Index for faster lookups
CREATE INDEX idx_game_results_game ON game_results(game_id);
CREATE INDEX idx_game_results_player ON game_results(player_id);

-- Allow public read/write (no auth for now — we'll add RLS later)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on games" ON games FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on game_results" ON game_results FOR ALL USING (true) WITH CHECK (true);
