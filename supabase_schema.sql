-- Add new category and fields to items table
-- Run this in Supabase SQL Editor

-- Drop old category constraint and add new one
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_category_check;
ALTER TABLE items ADD CONSTRAINT items_category_check CHECK (category IN (
  'Bedroom', 'Clothes', 'Shoes', 'Purses', 'Makeup', 'Skincare',
  'Hair Products', 'Hair Tools', 'Body Hygiene', 'Home Cleaning',
  'Tools', 'Canned Food', 'Seasonings', 'Crafts', 'Tech',
  'House Misc', 'Clothes Accessories', 'Kitchen', 'Cooking Oils', 'Kitchen Tools'
));

-- Drop old condition constraint and add new one
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_condition_check;
ALTER TABLE items ADD CONSTRAINT items_condition_check CHECK (condition IN (
  'New with tags', 'Like new', 'Good', 'Fair', 'Poor'
));

-- Add new columns
ALTER TABLE items ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS size_dimensions text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS original_price numeric(10,2);
ALTER TABLE items ADD COLUMN IF NOT EXISTS how_acquired text CHECK (how_acquired IN ('Bought', 'Gifted', 'Inherited', 'Impulse buy'));
ALTER TABLE items ADD COLUMN IF NOT EXISTS date_acquired text; -- stored as "MM/YYYY"
ALTER TABLE items ADD COLUMN IF NOT EXISTS emotional_attachment integer CHECK (emotional_attachment BETWEEN 1 AND 5);
ALTER TABLE items ADD COLUMN IF NOT EXISTS poshmark_asking_price numeric(10,2);
ALTER TABLE items ADD COLUMN IF NOT EXISTS flaws_notes text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS date_resolved date; -- when item left the home
