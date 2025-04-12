import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

// Feature flag to control whether to use the Edge Function or fallback
// Set this to false until the Edge Function is deployed
const USE_EDGE_FUNCTION = false;

// Centralized function to extract relevant tags from content
export async function suggestTags(content: string, existingTags: string[] = []): Promise<string[]> {
  try {
    // Remove HTML tags from content for better processing
    const plainTextContent = content.replace(/<[^>]*>?/gm, '');
    
    if (plainTextContent.trim().length < 20) {
      // If content is too short, don't suggest tags yet
      return [];
    }
    
    // Use Edge Function only if feature flag is enabled
    if (USE_EDGE_FUNCTION) {
      try {
        // Call the Supabase Edge Function that runs our Llama model
        const { data, error } = await supabase.functions.invoke('suggest-tags', {
          body: { 
            content: plainTextContent,
            existingTags: existingTags
          }
        });
        
        if (error) {
          console.error('Edge Function error:', error);
          // Fall through to fallback method
        } else {
          return data?.suggestedTags || [];
        }
      } catch (edgeFunctionError) {
        console.error('Edge Function failed:', edgeFunctionError);
        // Fall through to fallback method
      }
    }
    
    // Use fallback method if Edge Function is disabled or failed
    return fallbackTagSuggestion(plainTextContent, existingTags);
  } catch (error) {
    console.error('Error in tag suggestion:', error);
    // If all else fails, use fallback client-side method
    return fallbackTagSuggestion(content.replace(/<[^>]*>?/gm, ''), existingTags);
  }
}

// Fallback function for when the AI service is unavailable
function fallbackTagSuggestion(content: string, existingTags: string[] = []): string[] {
  // Comprehensive keyword mapping for common emotions, themes, and activities
  const keywordMap: Record<string, string[]> = {
    // Emotional States
    'happiness': ['happy', 'joy', 'joyful', 'excited', 'glad', 'content', 'cheerful', 'delighted', 'pleased', 'thrilled', 'ecstatic', 'elated', 'blissful', 'overjoyed'],
    'gratitude': ['grateful', 'thankful', 'blessed', 'appreciate', 'appreciation', 'thankfulness', 'counting blessings'],
    'sadness': ['sad', 'unhappy', 'disappointed', 'down', 'blue', 'depressed', 'gloomy', 'heartbroken', 'grief', 'sorrow', 'melancholy', 'despondent', 'miserable'],
    'anxiety': ['anxious', 'worried', 'nervous', 'stressed', 'tense', 'uneasy', 'apprehensive', 'fear', 'dread', 'panic', 'overthinking', 'stress', 'overwhelmed'],
    'anger': ['angry', 'frustrated', 'annoyed', 'irritated', 'upset', 'mad', 'furious', 'outraged', 'resentful', 'bitter', 'indignant', 'irate'],
    'calm': ['calm', 'peaceful', 'relaxed', 'tranquil', 'serene', 'balanced', 'centered', 'composed', 'content', 'still', 'quiet', 'meditation'],
    'pride': ['proud', 'accomplished', 'achievement', 'satisfied', 'successful', 'confidence', 'self-assured'],
    'hope': ['hope', 'hopeful', 'optimistic', 'positive', 'looking forward', 'anticipation', 'expectation', 'promise'],
    'loneliness': ['lonely', 'alone', 'isolated', 'solitude', 'abandoned', 'disconnected', 'separation'],
    'love': ['love', 'loving', 'affection', 'care', 'adore', 'fondness', 'attachment', 'devotion', 'romance', 'relationship'],
    
    // Relationships
    'family': ['family', 'parent', 'child', 'mother', 'father', 'sister', 'brother', 'son', 'daughter', 'grandparent', 'relative', 'aunt', 'uncle', 'cousin'],
    'friendship': ['friend', 'friendship', 'companion', 'buddy', 'pal', 'bestie', 'connection', 'bond', 'hanging out'],
    'romance': ['romance', 'romantic', 'date', 'dating', 'relationship', 'partner', 'significant other', 'boyfriend', 'girlfriend', 'spouse', 'husband', 'wife', 'couple'],
    'conflict': ['conflict', 'argument', 'disagreement', 'fight', 'tension', 'dispute', 'misunderstanding', 'confrontation'],
    
    // Life Areas
    'work': ['work', 'job', 'career', 'office', 'project', 'deadline', 'meeting', 'boss', 'colleague', 'coworker', 'profession', 'business', 'employment'],
    'study': ['study', 'school', 'college', 'university', 'class', 'course', 'lecture', 'homework', 'assignment', 'exam', 'test', 'education', 'learning', 'student'],
    'health': ['health', 'fitness', 'exercise', 'workout', 'diet', 'nutrition', 'illness', 'doctor', 'medical', 'wellness', 'well-being', 'sick', 'recovery', 'symptom'],
    'creativity': ['creative', 'create', 'art', 'artistic', 'paint', 'draw', 'craft', 'music', 'write', 'writing', 'design', 'imagination', 'inspiration', 'innovative'],
    'nature': ['nature', 'outdoors', 'outside', 'natural', 'tree', 'flower', 'plant', 'garden', 'park', 'forest', 'mountain', 'beach', 'ocean', 'hiking', 'walk'],
    'travel': ['travel', 'trip', 'journey', 'vacation', 'holiday', 'explore', 'adventure', 'destination', 'visit', 'tourism', 'abroad', 'foreign', 'sightseeing'],
    'finances': ['money', 'finance', 'financial', 'budget', 'saving', 'debt', 'income', 'expense', 'investment', 'cost', 'spending', 'afford'],
    'home': ['home', 'house', 'apartment', 'living space', 'cleaning', 'decoration', 'furniture', 'domestic', 'household', 'chore', 'moving', 'renovation'],
    
    // Personal Development
    'personal growth': ['growth', 'learn', 'improve', 'progress', 'goal', 'achievement', 'challenge', 'overcome', 'develop', 'self-improvement', 'better', 'potential', 'transformation'],
    'self-care': ['self-care', 'self care', 'care for myself', 'pamper', 'relax', 'rest', 'me time', 'treat myself', 'recharge', 'taking care of myself'],
    'reflection': ['reflect', 'reflection', 'introspection', 'thinking', 'contemplation', 'self-awareness', 'insight', 'understand myself', 'journal', 'meditation'],
    'mindfulness': ['mindful', 'mindfulness', 'present', 'awareness', 'conscious', 'attention', 'focus', 'intention', 'being present', 'in the moment'],
    'resilience': ['resilience', 'resilient', 'bounce back', 'recover', 'strength', 'perseverance', 'endurance', 'persistence', 'determination', 'overcome'],
    'spirituality': ['spiritual', 'spirituality', 'faith', 'belief', 'religion', 'prayer', 'worship', 'soul', 'divine', 'god', 'higher power', 'meaning'],
    'balance': ['balance', 'harmony', 'equilibrium', 'stability', 'steady', 'juggling', 'priorities', 'perspective', 'proportion']
  };
  
  // Convert content to lowercase for better matching
  const contentLower = content.toLowerCase();
  const suggestedTagsMap: Map<string, number> = new Map();
  
  // Check for keyword matches with scoring by frequency/relevance
  Object.entries(keywordMap).forEach(([tag, keywords]) => {
    if (existingTags.includes(tag)) return; // Skip already used tags
    
    let score = 0;
    keywords.forEach(keyword => {
      // Use regex to find whole word matches (more accurate than includes)
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = contentLower.match(regex);
      if (matches) {
        // More matches = higher score
        score += matches.length;
      }
    });
    
    if (score > 0) {
      suggestedTagsMap.set(tag, score);
    }
  });
  
  // Convert map to array and sort by score (highest first)
  const sortedTags = Array.from(suggestedTagsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);
  
  // Return top 5 suggestions
  return sortedTags.slice(0, 5);
}
