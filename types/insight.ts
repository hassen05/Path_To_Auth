export interface SavedInsight {
  id: string;
  message: string;
  source: 'ai' | 'user';
  entryId?: string;
  entryDate?: string;
  timestamp: string;
  tags?: string[];
}
