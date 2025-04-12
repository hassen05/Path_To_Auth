-- Add title field to journal_entries table
ALTER TABLE public.journal_entries 
  ADD COLUMN IF NOT EXISTS title TEXT;

-- Update RLS policies if needed to include title field
COMMENT ON COLUMN public.journal_entries.title IS 'Optional title for the journal entry';
