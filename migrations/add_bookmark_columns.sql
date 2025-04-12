-- Add bookmark functionality to chat_conversations table
ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS is_bookmarked BOOLEAN DEFAULT false;
ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS title TEXT;
