-- Create table for storing AI chat conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_ids UUID[] DEFAULT NULL,
  is_all_entries BOOLEAN DEFAULT FALSE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster user-based queries
CREATE INDEX IF NOT EXISTS chat_conversations_user_id_idx ON chat_conversations(user_id);

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
