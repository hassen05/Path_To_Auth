import { supabase } from './supabase';

/**
 * Initialize database tables that might not exist yet
 * This function should be called when the app starts
 */
export async function initDatabase() {
  try {
    // Create chat_conversations table if it doesn't exist
    const { error: chatTableError } = await supabase.rpc('create_chat_conversations_if_not_exists');
    
    if (chatTableError) {
      console.warn('Failed to initialize chat_conversations table:', chatTableError);
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

/**
 * Create a stored procedure in Supabase that we can call to create tables
 * This should be executed once in the Supabase SQL editor
 */
export const createStoredProcedures = `
-- Create a function to initialize the chat_conversations table
CREATE OR REPLACE FUNCTION create_chat_conversations_if_not_exists()
RETURNS void AS $$
BEGIN
  -- Check if table exists
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'chat_conversations'
  ) THEN
    -- Create the table
    CREATE TABLE public.chat_conversations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      entry_ids UUID[] DEFAULT NULL,
      is_all_entries BOOLEAN DEFAULT FALSE,
      messages JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create index for faster user-based queries
    CREATE INDEX chat_conversations_user_id_idx ON chat_conversations(user_id);

    -- Create RLS policies for secure access
    ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

    CREATE POLICY chat_conversations_select ON chat_conversations 
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY chat_conversations_insert ON chat_conversations 
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY chat_conversations_update ON chat_conversations 
      FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY chat_conversations_delete ON chat_conversations 
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END;
$$ LANGUAGE plpgsql;
`;
