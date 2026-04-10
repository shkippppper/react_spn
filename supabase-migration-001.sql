-- Run this in Supabase SQL Editor to update the schema
-- Adds buy_in to games table (shared for all players) and rebuy flag to game_results

ALTER TABLE games ADD COLUMN IF NOT EXISTS buy_in REAL DEFAULT 0;
ALTER TABLE game_results ADD COLUMN IF NOT EXISTS rebuy BOOLEAN DEFAULT false;
