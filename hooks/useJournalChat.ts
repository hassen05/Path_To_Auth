import { useState, useCallback, useEffect, useRef } from 'react';
import { JournalEntry } from '../types/journal';
import { AIService } from '../services/aiService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/auth';
import { useJournal } from './useJournal';

// Message types for chat
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

export interface SavedConversation {
  id: string;
  user_id: string;
  entry_ids: string[] | null;
  messages: ChatMessage[];
  last_updated: string;
  is_all_entries: boolean;
  is_bookmarked?: boolean;
  title?: string;
}

export interface UseJournalChatReturn {
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  selectedEntry: JournalEntry | null;
  selectEntry: (entry: JournalEntry) => Promise<void>;
  selectAllEntries: () => Promise<void>;
  isAllEntriesMode: boolean;
  clearChat: () => void;
  conversationId: string | null;
  refreshConversation: () => Promise<void>;
  bookmarkConversation: (id: string, isBookmarked: boolean) => Promise<void>;
  isBookmarked: boolean;
}

export function useJournalChat(): UseJournalChatReturn {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { entries } = useJournal(); // Get journal entries to monitor changes
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isAllEntriesMode, setIsAllEntriesMode] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Use ref to track the entries we're using for AI to prevent stale closures
  const latestEntriesRef = useRef<JournalEntry[]>([]);
  
  // Define the useEffect after function declarations to avoid using before declaration issue
  const handleEntryDeleted = useCallback(() => {
    if (!selectedEntry) return;
    
    const entryExists = entries.some(entry => entry.id === selectedEntry.id);
    if (!entryExists) {
      console.log('Selected entry was deleted, updating state');
      setSelectedEntry(null);
      setIsAllEntriesMode(true);
    }
  }, [entries, selectedEntry]);
  
  // Update entries ref whenever entries change
  useEffect(() => {
    // Update the reference to latest entries
    latestEntriesRef.current = entries;
    
    // Check if the selected entry still exists
    handleEntryDeleted();
  }, [entries, handleEntryDeleted]);
  
  
  // Load the most recent conversation on initial render
  useEffect(() => {
    if (!userId) return;
    
    const loadRecentConversation = async () => {
      try {
        // Get the most recent conversation
        const { data, error } = await supabase
          .from('chat_conversations')
          .select('*')
          .eq('user_id', userId)
          .order('last_updated', { ascending: false })
          .limit(1);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          const conversation = data[0];
          setConversationId(conversation.id);
          // Handle different data formats - the messages could be:  
          // 1. Already a parsed array from older database entries
          // 2. A JSON string that needs parsing (new format)
          if (Array.isArray(conversation.messages)) {
            // Messages are already an array (old format)
            console.log('Using messages in array format');
            setMessages(conversation.messages);
          } else if (typeof conversation.messages === 'string') {
            // Messages are a JSON string (new format)
            try {
              const parsedMessages = JSON.parse(conversation.messages);
              console.log('Successfully parsed messages from JSON string');
              setMessages(Array.isArray(parsedMessages) ? parsedMessages : []);
            } catch (parseError) {
              console.error('Error parsing messages:', parseError);
              setMessages([]);
            }
          } else {
            // Unexpected format
            console.warn('Messages in unexpected format:', typeof conversation.messages);
            setMessages([]);
          }
          
          setIsAllEntriesMode(conversation.is_all_entries);
          
          // If it's a single entry conversation, we need to fetch the entry
          if (!conversation.is_all_entries && conversation.entry_ids?.length) {
            const entryId = conversation.entry_ids[0];
            const { data: entryData, error: entryError } = await supabase
              .from('journal_entries')
              .select('*')
              .eq('id', entryId)
              .single();
              
            if (!entryError && entryData) {
              setSelectedEntry(entryData);
            }
          }
        }
      } catch (error) {
        console.error('Error loading recent conversation:', error);
      } finally {
        setInitializing(false);
      }
    };
    
    loadRecentConversation();
  }, [userId]);
  
  // Save messages to database whenever they change
  useEffect(() => {
    if (!userId || !conversationId || initializing || messages.length === 0) return;
    
    const saveMessages = async () => {
      try {
        // Always save messages as a JSON string to normalize the database format
        const { error } = await supabase
          .from('chat_conversations')
          .update({
            messages: JSON.stringify(messages),
            last_updated: new Date().toISOString()
          })
          .eq('id', conversationId);
          
        if (error) throw error;
      } catch (error) {
        console.error('Error saving messages:', error);
      }
    };
    
    saveMessages();
  }, [messages, userId, conversationId, initializing]);
  
  // Select a specific entry for chat
  const selectEntry = useCallback(async (entry: JournalEntry) => {
    try {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Validate entry
      if (!entry || !entry.id) {
        throw new Error('Invalid entry selected');
      }

      // Clear existing messages
      setMessages([]);
      
      // Set the selected entry and mode
      setSelectedEntry(entry);
      setIsAllEntriesMode(false);
      
      // Create or update conversation
      const { data: conversationData, error: conversationError } = await supabase
        .from('chat_conversations')
        .upsert([
          {
            id: conversationId || crypto.randomUUID(),
            user_id: userId,
            entry_ids: [entry.id],
            is_all_entries: false,
            last_updated: new Date().toISOString()
          }
        ], {
          onConflict: 'id'
        });
      
      if (conversationError) {
        console.error('Conversation error:', conversationError);
        throw new Error('Failed to create conversation');
      }
      
      // Update conversation ID
      setConversationId(conversationData?.[0]?.id || null);
      
      // Load any existing messages for this conversation
      if (conversationData?.[0]?.id) {
        const { data: messagesData, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', conversationData[0].id)
          .order('timestamp', { ascending: true });
        
        if (messagesError) {
          console.error('Messages error:', messagesError);
          throw new Error('Failed to load messages');
        }
        
        if (messagesData) {
          setMessages(messagesData);
        }
      }
    } catch (error) {
      console.error('Error selecting entry:', error);
      setSelectedEntry(null);
      throw error;
    }
  }, [userId, conversationId]);

  // Generate AI response based on context (single entry or all entries)
  const generateAIResponse = async (userMessage: string): Promise<string> => {
    try {
      if (isAllEntriesMode) {
        // Use the cached entries from the useJournal hook
        const entriesData = latestEntriesRef.current;
        
        if (!entriesData || entriesData.length === 0) {
          return "I don't see any journal entries to analyze. Try adding some entries first.";
        }

        // Create a summary of the entries for the AI
        const entriesSummary = entriesData.map(entry => (
          `Date: ${new Date(entry.created_at).toLocaleDateString()}, Mood: ${entry.mood}\nContent: ${entry.content.substring(0, 200)}${entry.content.length > 200 ? '...' : ''}`
        )).join('\n\n---\n\n');
        
        // Use the AI service to generate a response for all entries
        return await AIService.chatWithAllJournals(entriesSummary, userMessage);
      } else if (selectedEntry) {
        // Create context for single entry
        const entryContext = `Journal Entry Date: ${new Date(selectedEntry.created_at).toLocaleDateString()}\nMood: ${selectedEntry.mood}\nTags: ${selectedEntry.tags?.join(', ') || 'None'}\nContent: ${selectedEntry.content}`;
        
        // Use the AI service to generate a response for the selected entry
        return await AIService.chatWithJournal(entryContext, userMessage);
      } else {
        return "I'm not sure which journal entry we're discussing. Please select an entry first.";
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I'm sorry, I encountered an error. Please try again.";
    }
  };

  // Send a message and get AI response
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !userId) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Generate AI response
      const aiResponse = await generateAIResponse(text);
      
      // Create AI message
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };
      
      // Update messages with AI response
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I couldn't process your message. Please try again.",
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, selectedEntry, isAllEntriesMode, generateAIResponse]);
  
  // Create a new conversation in the database
  const createNewConversation = async (entryIds: string[] | null, isAll: boolean): Promise<string> => {
    if (!userId) throw new Error('User not authenticated');
    
    const initialMessage: ChatMessage = {
      id: Date.now().toString(),
      text: isAll 
        ? "I'm ready to discuss all your journal entries. What would you like to explore about your journaling history?"
        : `I'm looking at your journal entry. What would you like to discuss about it?`,
      sender: 'ai',
      timestamp: new Date().toISOString(),
    };
    
    // Store the initial message as a JSON string for consistency
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: userId,
        entry_ids: entryIds,
        is_all_entries: isAll,
        messages: JSON.stringify([initialMessage]),
      })
      .select('id')
      .single();
      
    if (error) throw error;
    
    setMessages([initialMessage]);
    return data.id;
  };
  
  // Select all entries mode for chat
  const selectAllEntries = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      setSelectedEntry(null);
      setIsAllEntriesMode(true);
      
      // First check if there's an existing conversation for all entries
      const { data: existingConversations, error: queryError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_all_entries', true)
        .order('last_updated', { ascending: false })
        .limit(1);
      
      if (queryError) throw queryError;
      
      // If we found an existing conversation, use it
      if (existingConversations && existingConversations.length > 0) {
        const conversation = existingConversations[0];
        setConversationId(conversation.id);
        // Handle different message formats
        if (Array.isArray(conversation.messages)) {
          setMessages(conversation.messages);
        } else if (typeof conversation.messages === 'string') {
          try {
            const parsedMessages = JSON.parse(conversation.messages);
            setMessages(Array.isArray(parsedMessages) ? parsedMessages : []);
          } catch (parseError) {
            console.error('Error parsing messages:', parseError);
            setMessages([]);
          }
        } else {
          console.warn('Messages in unexpected format:', typeof conversation.messages);
          setMessages([]);
        }
        console.log('Loaded existing conversation for all entries:', conversation.id);
      } else {
        // Otherwise create a new conversation for all entries
        const newConversationId = await createNewConversation(null, true);
        setConversationId(newConversationId);
        console.log('Created new conversation for all entries:', newConversationId);
      }
    } catch (error) {
      console.error('Error selecting all entries mode:', error);
      
      // Fallback message
      const fallbackMessage: ChatMessage = {
        id: Date.now().toString(),
        text: "I'm ready to discuss all your journal entries. What patterns or insights would you like to explore?",
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };
      
      setMessages([fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, createNewConversation]);
  
  // Clear current chat and start fresh
  const clearChat = useCallback(() => {
    setMessages([]);
    setSelectedEntry(null);
    setIsAllEntriesMode(false);
    setConversationId(null);
  }, []);

  /**
   * Function to explicitly refresh the current conversation
   * This can be called when journal entries are added or deleted
   */
  const refreshConversation = useCallback(async () => {
    if (!userId || !conversationId) return;
    
    try {
      setIsLoading(true);
      
      // If we're in single entry mode and the entry was deleted, switch to all entries mode
      if (!isAllEntriesMode && selectedEntry) {
        const entryExists = latestEntriesRef.current.some(e => e.id === selectedEntry.id);
        if (!entryExists) {
          // Handle deleted entry case - switch to all entries mode
          setSelectedEntry(null);
          setIsAllEntriesMode(true);
          
          // Create a new conversation for all entries if the current one was for a deleted entry
          const newConversationId = await createNewConversation(null, true);
          setConversationId(newConversationId);
          return;
        }
      }
      
      // For single entry, reload the entry data
      if (!isAllEntriesMode && selectedEntry) {
        const { data, error } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('id', selectedEntry.id)
          .single();
          
        if (!error && data) {
          setSelectedEntry(data as JournalEntry);
        }
      }
      
      // Add a system message about the refresh
      const refreshMessage: ChatMessage = {
        id: Date.now().toString(),
        text: "I've refreshed my knowledge with your latest journal entries. How can I help you now?",
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, refreshMessage]);
      
      // Save the updated messages to the database
      await supabase
        .from('chat_conversations')
        .update({
          messages: JSON.stringify([...messages, refreshMessage]),
          last_updated: new Date().toISOString()
        })
        .eq('id', conversationId);
        
    } catch (error) {
      console.error('Error refreshing conversation:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, conversationId, isAllEntriesMode, selectedEntry, messages, selectAllEntries]);

  // Bookmark a conversation
  const bookmarkConversation = useCallback(async (id: string, isBookmarked: boolean) => {
    if (!userId || !id) return;
    
    try {
      setIsLoading(true);
      
      // Update the conversation bookmark status in the database
      const { error } = await supabase
        .from('chat_conversations')
        .update({
          is_bookmarked: isBookmarked,
          // If bookmarking for the first time and no title exists, create a default title
          title: isBookmarked ? `Chat from ${new Date().toLocaleDateString()}` : undefined
        })
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Update local state
      setIsBookmarked(isBookmarked);
      
      return;
    } catch (error) {
      console.error('Error bookmarking conversation:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);
  
  // Update isBookmarked state when conversation changes
  useEffect(() => {
    const fetchBookmarkStatus = async () => {
      if (!userId || !conversationId) return;
      
      try {
        const { data, error } = await supabase
          .from('chat_conversations')
          .select('is_bookmarked')
          .eq('id', conversationId)
          .single();
          
        if (error) throw error;
        
        setIsBookmarked(data.is_bookmarked || false);
      } catch (error) {
        console.error('Error fetching bookmark status:', error);
      }
    };
    
    fetchBookmarkStatus();
  }, [userId, conversationId]);

  return {
    messages,
    sendMessage,
    isLoading,
    selectedEntry,
    selectEntry,
    selectAllEntries,
    isAllEntriesMode,
    clearChat,
    conversationId,
    refreshConversation,
    bookmarkConversation,
    isBookmarked,
  };
}
