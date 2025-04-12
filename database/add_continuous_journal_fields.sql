-- First, create the journal_series table
CREATE TABLE IF NOT EXISTS journal_series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  cover_image TEXT
);

-- Then, add continuous journal support to journal_entries table
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES journal_series(id);
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS sequence INTEGER;

-- Add index for faster retrieval
CREATE INDEX IF NOT EXISTS idx_journal_entries_series_id ON journal_entries(series_id);
CREATE INDEX IF NOT EXISTS idx_journal_series_user_id ON journal_series(user_id);
