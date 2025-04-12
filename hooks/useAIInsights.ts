import { useState, useCallback } from 'react';
import { JournalEntry } from '../types/journal';

export interface UseAIInsightsReturn {
  insights: string[];
  generateInsights: (journalContent?: string) => void;
  isGenerating: boolean;
}

export function useAIInsights(): UseAIInsightsReturn {
  const [insights, setInsights] = useState<string[]>([
    "You've been writing consistently about your goals and aspirations.",
    "Your entries show a positive trend in emotional well-being.",
    "Consider exploring more outdoor activities based on your recent entries.",
  ]);

  const [isGenerating, setIsGenerating] = useState(false);

  const generateInsights = useCallback(async (journalContent?: string) => {
    setIsGenerating(true);
    // In a real app, this would call an AI service
    setInsights([
      "You've been showing great progress in your personal growth journey.",
      "Your writing style has become more reflective and introspective.",
      "Consider journaling about your daily achievements, no matter how small.",
    ]);
    setIsGenerating(false);
  }, []);

  return {
    insights,
    generateInsights,
    isGenerating,
  };
}
