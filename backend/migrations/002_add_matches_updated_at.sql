-- ARORA ESPORTS PostgreSQL Schema Migration 002
-- Ensure matches table has updated_at column to support time synchronization

ALTER TABLE matches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
