import { useState, useCallback, useEffect } from 'react';
import { JournalEntry, Mood, JournalEntryType, JournalPrompt, AIInsight, CreateJournalEntry } from '../types/journal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/auth';

export type CreateEntryData = {
  content: string;
  title?: string;
  mood: Mood;
  tags: string[];
  entry_type: JournalEntryType;
  prompt_id?: string;
};

export interface JournalSeries {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  cover_image?: string;
}

export interface UseJournalReturn {
  entries: JournalEntry[];
  prompts: JournalPrompt[];
  insights: AIInsight[];
  series: JournalSeries[];
  addEntry: (data: CreateEntryData) => Promise<void>;
  updateEntry: (id: string, data: Partial<CreateEntryData>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  loadEntries: () => Promise<void>;
  loadPrompts: () => Promise<void>;
  loadInsights: () => Promise<void>;
  generateInsight: (entryIds: string[]) => Promise<void>;
  bookmarkInsight: (id: string, isBookmarked: boolean) => Promise<void>;
  filterEntriesByType: (type: JournalEntryType | 'all') => JournalEntry[];
  // New methods for continuous journals
  loadSeries: () => Promise<void>;
  createSeries: (title: string, description?: string) => Promise<string>;  // Returns series_id
  updateSeries: (id: string, data: Partial<JournalSeries>) => Promise<void>;
  deleteSeries: (id: string) => Promise<void>;
  getContinuousEntries: (seriesId: string) => JournalEntry[];
  addContinuousEntry: (seriesId: string, data: Omit<CreateEntryData, 'series_id' | 'entry_type'>) => Promise<void>;
  loading: boolean;
  promptsLoading: boolean;
  insightsLoading: boolean;
  seriesLoading: boolean;
}

export function useJournal(): UseJournalReturn {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [prompts, setPrompts] = useState<JournalPrompt[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [series, setSeries] = useState<JournalSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const { session } = useAuth();

  // Load entries, prompts, insights, and series when component mounts
  useEffect(() => {
    if (session?.user) {
      loadEntries();
      loadPrompts();
      loadInsights();
      loadSeries();
    }
  }, [session?.user]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEntries(data || []);
    } catch (error) {
      console.error('Error loading journal entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPrompts = async () => {
    if (!session?.user) return;

    setPromptsLoading(true);
    try {
      const { data, error } = await supabase
        .from('journal_prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPrompts(data || []);
    } catch (error) {
      console.error('Error loading journal prompts:', error);
    } finally {
      setPromptsLoading(false);
    }
  };

  const loadInsights = async () => {
    if (!session?.user) return;

    setInsightsLoading(true);
    try {
      const { data, error } = await supabase
        .from('journal_insights')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInsights(data || []);
    } catch (error) {
      console.error('Error loading journal insights:', error);
    } finally {
      setInsightsLoading(false);
    }
  };

  const generateInsight = useCallback(async (entryIds: string[]) => {
    if (!session?.user || entryIds.length === 0) return;

    try {
      // Typically, this would call an API endpoint that processes entries with AI
      // For now, we'll simulate it with a placeholder
      const insightData = {
        user_id: session.user.id,
        entry_ids: entryIds,
        content: "This is a placeholder for AI-generated insight. In production, this would contain personalized reflections based on your journal entries.",
        emotional_patterns: "You've been showing a mix of emotions lately, with a trend toward more positive experiences.",
        actionable_steps: ["Practice mindfulness daily", "Connect with a friend", "Try a new hobby"],
        affirmation: "You are growing and learning every day, even when progress feels slow.",
        created_at: new Date().toISOString(),
        is_bookmarked: false
      };

      const { error } = await supabase
        .from('journal_insights')
        .insert(insightData);

      if (error) throw error;

      // Update entries to mark them as contributing to an insight
      await supabase
        .from('journal_entries')
        .update({ milestone: true })
        .in('id', entryIds);

      await loadInsights();
      await loadEntries();
    } catch (error) {
      console.error('Error generating insight:', error);
      throw error;
    }
  }, [session?.user]);

  const bookmarkInsight = useCallback(async (id: string, isBookmarked: boolean) => {
    if (!session?.user) return;

    try {
      const { error } = await supabase
        .from('journal_insights')
        .update({ is_bookmarked: isBookmarked })
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) throw error;

      await loadInsights();
    } catch (error) {
      console.error('Error updating bookmark status:', error);
      throw error;
    }
  }, [session?.user]);

  const filterEntriesByType = useCallback((type: JournalEntryType | 'all') => {
    if (type === 'all') return entries;
    return entries.filter(entry => entry.entry_type === type);
  }, [entries]);

  const addEntry = useCallback(async (data: CreateEntryData) => {
    if (!session?.user) return;

    try {
      // Check if this would be a milestone entry (every 10th entry)
      const isMilestone = entries.length % 10 === 9; // This will make the new entry the 10th, 20th, etc.

      const { error } = await supabase
        .from('journal_entries')
        .insert({
          ...data,
          user_id: session.user.id,
          milestone: isMilestone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Reload entries to get the newly added one
      await loadEntries();

      // If this is a milestone entry, generate an insight
      if (isMilestone) {
        // Get the last 10 entries (including the new one after reloading)
        const lastTenEntries = entries.slice(0, 10);
        if (lastTenEntries.length === 10) {
          const entryIds = lastTenEntries.map(entry => entry.id);
          await generateInsight(entryIds);
        }
      }
    } catch (error) {
      console.error('Error adding journal entry:', error);
      throw error;
    }
  }, [session?.user, entries.length, generateInsight]);

  const updateEntry = useCallback(async (id: string, data: Partial<CreateEntryData>) => {
    if (!session?.user) {
      console.error('No user session found');
      throw new Error('You must be logged in to update entries');
    }

    try {
      console.log('Updating entry with ID:', id);
      console.log('Update data received:', JSON.stringify(data, null, 2));

      // Validate the entry exists before updating
      const { data: existingEntry, error: fetchError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching entry to update:', fetchError);
        throw new Error('Could not find the journal entry to update');
      }

      if (!existingEntry) {
        throw new Error('Journal entry not found');
      }

      // Process title field if present
      if (data.title !== undefined) {
        if (typeof data.title === 'string') {
          data.title = data.title.trim();
          console.log('Title being updated to:', data.title);
        } else {
          console.error('Invalid title format:', data.title);
          throw new Error('Title must be a string');
        }
      }

      // Process content field if present
      if (data.content !== undefined && !data.content.trim()) {
        console.error('Content cannot be empty');
        throw new Error('Journal content cannot be empty');
      }

      // Create a clean update object with proper typing
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      // Only include fields that are explicitly provided
      if (data.content !== undefined) updateData.content = data.content;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.mood !== undefined) updateData.mood = data.mood;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.entry_type !== undefined) updateData.entry_type = data.entry_type;
      if (data.prompt_id !== undefined) updateData.prompt_id = data.prompt_id;

      console.log('Final update payload:', JSON.stringify(updateData, null, 2));

      // Perform the update
      const { error } = await supabase
        .from('journal_entries')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Supabase update error:', error);
        throw new Error(`Failed to update journal entry: ${error.message}`);
      }

      console.log('Update successful, reloading entries');
      // Reload entries to get the updated one
      await loadEntries();
    } catch (error) {
      console.error('Error updating journal entry:', error);
      throw error;
    }
  }, [session?.user, loadEntries]);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', session?.user?.id);

      if (error) throw error;

      // Reload entries to remove the deleted one
      await loadEntries();
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      throw error;
    }
  }, [session?.user?.id]);

  // Load journal series
  const loadSeries = async () => {
    if (!session?.user) return;

    setSeriesLoading(true);
    try {
      const { data, error } = await supabase
        .from('journal_series')
        .select('*')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setSeries(data || []);
    } catch (error) {
      console.error('Error loading journal series:', error);
    } finally {
      setSeriesLoading(false);
    }
  };

  // Create a new journal series
  const createSeries = async (title: string, description?: string): Promise<string> => {
    if (!session?.user) throw new Error('You must be logged in to create a journal series');

    try {
      const newSeries = {
        user_id: session.user.id,
        title,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      };

      const { data, error } = await supabase
        .from('journal_series')
        .insert(newSeries)
        .select()
        .single();

      if (error) throw error;
      
      // Reload series to get the newly created one
      await loadSeries();
      
      return data.id;
    } catch (error) {
      console.error('Error creating journal series:', error);
      throw error;
    }
  };

  // Update a journal series
  const updateSeries = async (id: string, data: Partial<JournalSeries>) => {
    if (!session?.user) return;

    try {
      const updateData: Record<string, any> = {
        ...data,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('journal_series')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) throw error;

      // Reload series to get the updated one
      await loadSeries();
    } catch (error) {
      console.error('Error updating journal series:', error);
      throw error;
    }
  };

  // Delete a journal series and all its entries
  const deleteSeries = async (id: string) => {
    if (!session?.user) return;

    try {
      // First update all entries to remove the series_id (or we could delete them)
      const { error: updateError } = await supabase
        .from('journal_entries')
        .update({ series_id: null })
        .eq('series_id', id)
        .eq('user_id', session.user.id);

      if (updateError) throw updateError;

      // Then delete the series
      const { error } = await supabase
        .from('journal_series')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) throw error;

      // Reload both entries and series
      await loadEntries();
      await loadSeries();
    } catch (error) {
      console.error('Error deleting journal series:', error);
      throw error;
    }
  };

  // Get all entries for a specific continuous journal series
  const getContinuousEntries = useCallback((seriesId: string) => {
    return entries.filter(entry => entry.series_id === seriesId)
      .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  }, [entries]);

  // Add an entry to a continuous journal series
  const addContinuousEntry = async (seriesId: string, data: Omit<CreateEntryData, 'series_id' | 'entry_type'>) => {
    if (!session?.user) return;

    try {
      // Get the highest sequence number in this series
      const seriesEntries = getContinuousEntries(seriesId);
      const nextSequence = seriesEntries.length > 0 
        ? (Math.max(...seriesEntries.map(entry => entry.sequence || 0)) + 1) 
        : 1;

      // Prepare the entry data
      const entryData = {
        ...data,
        user_id: session.user.id,
        series_id: seriesId,
        entry_type: 'continuous' as JournalEntryType,
        sequence: nextSequence,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('journal_entries')
        .insert(entryData);

      if (error) throw error;

      // Update the series to reflect the latest update
      await updateSeries(seriesId, { updated_at: new Date().toISOString() });

      // Reload entries to get the newly added one
      await loadEntries();
    } catch (error) {
      console.error('Error adding continuous journal entry:', error);
      throw error;
    }
  };

  return {
    entries,
    prompts,
    insights,
    series,
    addEntry,
    updateEntry,
    deleteEntry,
    loadEntries,
    loadPrompts,
    loadInsights,
    generateInsight,
    bookmarkInsight,
    filterEntriesByType,
    // New continuous journal methods
    loadSeries,
    createSeries,
    updateSeries,
    deleteSeries,
    getContinuousEntries,
    addContinuousEntry,
    loading,
    promptsLoading,
    insightsLoading,
    seriesLoading,
  };
}
