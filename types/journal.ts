export type Mood = 'happy' | 'sad' | 'neutral' | 'excited' | 'anxious' | 'calm';

export type JournalEntryType = 'daily_prompt' | 'on_demand';

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
}

export interface CreateJournalEntry {
  content: string;
  title?: string;
  mood: Mood;
  tags?: string[];
  entry_type: JournalEntryType;
  prompt_id?: string;
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
