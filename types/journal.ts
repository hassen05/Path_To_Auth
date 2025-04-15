export type Mood = 'happy' | 'sad' | 'neutral' | 'excited' | 'anxious' | 'calm';

export type JournalEntryType = 'daily_prompt' | 'on_demand' | 'continuous';

export interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  title?: string; // Optional title for the journal entry
  mood: Mood;
  tags: string[];
  entry_type: JournalEntryType;
  prompt_id?: string; // Optional reference to a prompt if applicable
  created_at: string;
  updated_at: string;
  milestone?: boolean; // Indicates if this is a milestone entry (e.g., every 10th)
  series_id?: string; // Optional reference to a continuous journal series
  sequence?: number; // Optional sequence number within a continuous journal series
}

export interface CreateJournalEntry {
  content: string;
  title?: string;
  mood: Mood;
  tags?: string[];
  entry_type: JournalEntryType;
  prompt_id?: string;
  series_id?: string; // For continuous journal entries
  sequence?: number; // Position in continuous journal
}

export interface JournalPrompt {
  id: string;
  question: string;
  theme?: string;
  created_at: string;
}

export interface AIInsight {
  id: string;
  user_id: string;
  entry_ids: string[]; // References to the entries this insight is based on
  content: string; // The AI's reflection and guidance
  emotional_patterns?: string;
  actionable_steps?: string[];
  affirmation?: string;
  created_at: string;
  is_bookmarked?: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
  conversation_id: string;
}

export interface SavedInsight {
  id: string;
  user_id: string;
  conversation_id: string;
  title: string;
  created_at: string;
  is_bookmarked: boolean;
}

export interface ReflectionTheme {
  id: string;
  name: string;
  description: string;
  icon?: string; // Optional icon name for the theme
  order?: number; // Optional ordering for the theme list
}

export interface ReflectionQuestion {
  id: string;
  question: string;
  answer?: string;
  theme_id: string;
  order: number; // Position in the question sequence (1-10)
  created_at: string;
}

export interface ReflectionSession {
  id: string;
  user_id: string;
  theme_id: string;
  theme_name: string;
  questions: ReflectionQuestion[];
  current_question_index: number;
  status: 'in_progress' | 'completed';
  started_at: string;
  completed_at?: string;
  analysis?: {
    negative_patterns: string[];
    positive_patterns: string[];
    affirmations: string[];
    actionable_steps: string[];
    encouragement: string;
  };
}
