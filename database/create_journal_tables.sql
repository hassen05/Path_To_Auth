-- Create table for journal prompts
CREATE TABLE IF NOT EXISTS public.journal_prompts (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  question TEXT NOT NULL,
  theme TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add some initial prompts
INSERT INTO public.journal_prompts (question, theme, created_at, updated_at) VALUES
('What made you feel most alive today?', 'gratitude', NOW(), NOW()),
('What is one small thing you''re grateful for right now?', 'gratitude', NOW(), NOW()),
('What challenging situation helped you grow recently?', 'growth', NOW(), NOW()),
('What emotion has been most present for you lately?', 'emotions', NOW(), NOW()),
('If your body could speak, what would it tell you right now?', 'self-awareness', NOW(), NOW()),
('What relationship in your life needs more attention?', 'relationships', NOW(), NOW()),
('What fear has been holding you back?', 'challenges', NOW(), NOW()),
('What are you learning about yourself this week?', 'growth', NOW(), NOW()),
('What boundaries do you need to set or maintain?', 'self-care', NOW(), NOW()),
('What simple pleasure brought you joy recently?', 'gratitude', NOW(), NOW());

-- Create table for AI insights
CREATE TABLE IF NOT EXISTS public.journal_insights (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_ids UUID[] NOT NULL, -- Array of journal entry IDs this insight is based on
  content TEXT NOT NULL,
  emotional_patterns TEXT,
  actionable_steps TEXT[],
  affirmation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_bookmarked BOOLEAN DEFAULT FALSE,
  
  -- Add RLS policies
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Set up RLS (Row Level Security) for the insights table
ALTER TABLE public.journal_insights ENABLE ROW LEVEL SECURITY;

-- Define policies
CREATE POLICY "Users can view their own insights" 
  ON public.journal_insights 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insights" 
  ON public.journal_insights 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights" 
  ON public.journal_insights 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Update the journal_entries table to add new fields
ALTER TABLE public.journal_entries 
  ADD COLUMN IF NOT EXISTS entry_type TEXT DEFAULT 'on_demand',
  ADD COLUMN IF NOT EXISTS prompt_id UUID NULL,
  ADD COLUMN IF NOT EXISTS milestone BOOLEAN DEFAULT FALSE;

-- Add Foreign key constraint to journal_entries
ALTER TABLE public.journal_entries
  ADD CONSTRAINT fk_prompt
  FOREIGN KEY (prompt_id)
  REFERENCES public.journal_prompts(id)
  ON DELETE SET NULL;
