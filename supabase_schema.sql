-- Migration: add new columns (run this in Supabase SQL Editor)

ALTER TABLE items ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS size text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS original_price numeric(10,2);
ALTER TABLE items ADD COLUMN IF NOT EXISTS how_acquired text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS date_acquired text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS emotional_attachment integer;
ALTER TABLE items ADD COLUMN IF NOT EXISTS asking_price numeric(10,2);
ALTER TABLE items ADD COLUMN IF NOT EXISTS flaws text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS date_resolved date;
