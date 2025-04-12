import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedInsight } from '../types/insight';
import { useAuth } from '../contexts/auth';

const STORAGE_KEY = 'saved_insights';

interface UseSavedInsightsReturn {
  savedInsights: SavedInsight[];
  saveInsight: (insight: Omit<SavedInsight, 'id' | 'timestamp'>) => Promise<void>;
  deleteInsight: (id: string) => Promise<void>;
  updateInsight: (id: string, updates: Partial<Omit<SavedInsight, 'id'>>) => Promise<void>;
  loading: boolean;
}

export function useSavedInsights(): UseSavedInsightsReturn {
  const [savedInsights, setSavedInsights] = useState<SavedInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  // Load saved insights when component mounts
  useEffect(() => {
    if (session?.user) {
      loadSavedInsights();
    }
  }, [session?.user]);

  const getUserKey = useCallback(() => {
    return `${STORAGE_KEY}_${session?.user?.id || 'anonymous'}`;
  }, [session?.user?.id]);

  const loadSavedInsights = useCallback(async () => {
    setLoading(true);
    try {
      const userKey = getUserKey();
      const storedInsights = await AsyncStorage.getItem(userKey);
      
      if (storedInsights) {
        setSavedInsights(JSON.parse(storedInsights));
      } else {
        setSavedInsights([]);
      }
    } catch (error) {
      console.error('Error loading saved insights:', error);
      setSavedInsights([]);
    } finally {
      setLoading(false);
    }
  }, [getUserKey]);

  const saveSavedInsights = useCallback(async (insights: SavedInsight[]) => {
    try {
      const userKey = getUserKey();
      await AsyncStorage.setItem(userKey, JSON.stringify(insights));
    } catch (error) {
      console.error('Error saving insights:', error);
      throw error;
    }
  }, [getUserKey]);

  const saveInsight = useCallback(async (insight: Omit<SavedInsight, 'id' | 'timestamp'>) => {
    try {
      const newInsight: SavedInsight = {
        ...insight,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      };
      
      const updatedInsights = [...savedInsights, newInsight];
      setSavedInsights(updatedInsights);
      await saveSavedInsights(updatedInsights);
    } catch (error) {
      console.error('Error saving insight:', error);
      throw error;
    }
  }, [savedInsights, saveSavedInsights]);

  const deleteInsight = useCallback(async (id: string) => {
    try {
      const updatedInsights = savedInsights.filter(insight => insight.id !== id);
      setSavedInsights(updatedInsights);
      await saveSavedInsights(updatedInsights);
    } catch (error) {
      console.error('Error deleting insight:', error);
      throw error;
    }
  }, [savedInsights, saveSavedInsights]);

  const updateInsight = useCallback(async (id: string, updates: Partial<Omit<SavedInsight, 'id'>>) => {
    try {
      const updatedInsights = savedInsights.map(insight => 
        insight.id === id ? { ...insight, ...updates } : insight
      );
      setSavedInsights(updatedInsights);
      await saveSavedInsights(updatedInsights);
    } catch (error) {
      console.error('Error updating insight:', error);
      throw error;
    }
  }, [savedInsights, saveSavedInsights]);

  return {
    savedInsights,
    saveInsight,
    deleteInsight,
    updateInsight,
    loading
  };
}
