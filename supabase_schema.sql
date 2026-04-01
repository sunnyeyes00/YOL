-- Run this in Supabase SQL Editor

-- Add new columns if they don't exist
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

-- Settings table for monthly intention etc.
CREATE TABLE IF NOT EXISTS settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow all for anon" ON settings
  FOR ALL USING (true) WITH CHECK (true);
