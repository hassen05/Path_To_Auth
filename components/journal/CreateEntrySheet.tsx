import React, { useState, useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Platform, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { Button, useTheme, Text, Card, Divider } from 'react-native-paper';
import { BottomSheet } from '../common/BottomSheet';
import RichTextEditor, { RichTextEditorRef } from './RichTextEditor';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mood, JournalEntryType, JournalPrompt } from '../../types/journal';
import { TagsInput } from './TagsInput';
// No longer need LinearGradient for the white header design
import { format } from 'date-fns';

interface CreateEntrySheetProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: {
    content: string;
    title?: string;
    mood: Mood;
    tags: string[];
    entry_type: JournalEntryType;
    prompt_id?: string;
  }) => Promise<void>;
  autoSave?: boolean;
  prompts?: JournalPrompt[];
  entryType?: JournalEntryType;
  initialTags?: string[];
}

export function CreateEntrySheet({ 
  visible, 
  onDismiss, 
  onSubmit, 
  autoSave = true,
  prompts = [], 
  entryType = 'on_demand',
  initialTags = []
}: CreateEntrySheetProps) {
  // Load custom fonts with useFonts hook
  const [fontsLoaded] = useFonts({
    'GreatVibes-Regular': require('../../assets/fonts/GreatVibes-Regular.ttf'),
  });
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [mood, setMood] = useState<Mood>('neutral');
  const [tags, setTags] = useState<string[]>(initialTags);
  const [selectedPrompt, setSelectedPrompt] = useState<JournalPrompt | null>(null);
  const [currentEntryType, setCurrentEntryType] = useState<JournalEntryType>(entryType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const theme = useTheme();
  const editorRef = useRef<RichTextEditorRef>(null);
  
  // We'll use the SummaryNotes font in the text editor
  
  // Auto-save draft to AsyncStorage every 10 seconds
  useEffect(() => {
    if (!autoSave || !isDirty) return;
    
    const saveInterval = setInterval(async () => {
      if (isDirty) {
        try {
          const htmlContent = await editorRef.current?.getContentHtml() || '';
          if (htmlContent.trim()) {
            const draftData = {
              content: htmlContent,
              mood,
              tags,
              entry_type: currentEntryType,
              prompt_id: selectedPrompt?.id
            };
            await AsyncStorage.setItem('journal_draft', JSON.stringify(draftData));
          }
        } catch (error) {
          console.error('Error auto-saving draft:', error);
        }
      }
    }, 10000);
    
    return () => clearInterval(saveInterval);
  }, [isDirty, autoSave, mood, tags, currentEntryType, selectedPrompt]);
  
  // Load draft when sheet becomes visible
  useEffect(() => {
    if (visible && autoSave) {
      loadDraft();
    }
  }, [visible]);
  
  const loadDraft = async () => {
    try {
      const savedDraftJson = await AsyncStorage.getItem('journal_draft');
      if (savedDraftJson && editorRef.current) {
        try {
          const draftData = JSON.parse(savedDraftJson);
          // Small delay to ensure editor is ready
          setTimeout(() => {
            editorRef.current?.setContentHTML(draftData.content || '');
          }, 300);
          
          // Restore other draft data
          if (draftData.mood) setMood(draftData.mood);
          if (draftData.tags) setTags(draftData.tags);
          if (draftData.entry_type) setCurrentEntryType(draftData.entry_type);
          
          // Find matching prompt if prompt_id exists
          if (draftData.prompt_id) {
            const prompt = prompts.find(p => p.id === draftData.prompt_id);
            if (prompt) setSelectedPrompt(prompt);
          }
        } catch (error) {
          console.error('Error parsing draft data:', error);
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };
  
  const handleContentChange = (html: string) => {
    setContent(html);
    setIsDirty(true);
  };
  
  const handleTitleChange = (text: string) => {
    // Ensure clean input and prevent unexpected behavior
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    setTitle(cleanedText);
    setIsDirty(true);
  };

  // Select a random prompt from available prompts
  const selectRandomPrompt = () => {
    if (prompts.length === 0) return;
    const randomIndex = Math.floor(Math.random() * prompts.length);
    setSelectedPrompt(prompts[randomIndex]);
  };
  
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const htmlContent = await editorRef.current?.getContentHtml() || '';
      
      console.log('Submitting new entry with:', {
        content: htmlContent,
        title,
        mood,
        tags,
        entry_type: currentEntryType,
        prompt_id: selectedPrompt?.id
      });
      
      if (htmlContent.trim()) {
        await onSubmit({
          content: htmlContent,
          title,
          mood,
          tags,
          entry_type: currentEntryType,
          prompt_id: selectedPrompt?.id
        });

        // Clear draft on successful submit
        try {
          await AsyncStorage.removeItem('journal_draft');
        } catch (error) {
          console.error('Error clearing draft:', error);
        }
        
        onDismiss();
      }
    } catch (error) {
      console.error('Error creating entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper to get emoji for mood
  const getMoodEmoji = (moodOption: Mood): string => {
    const emojiMap: Record<Mood, string> = {
      happy: '😊',
      sad: '😢',
      neutral: '😐',
      excited: '🙂',
      anxious: '😰',
      calm: '😌'
    };
    return emojiMap[moodOption];
  };

  useEffect(() => {
    console.log('Current title state:', title);
  }, [title]);

  // Show loading indicator if fonts are not loaded yet
  if (!fontsLoaded) {
    return (
      <BottomSheet visible={visible} onDismiss={onDismiss} fullHeight={true}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color="#764094" />
          <Text style={{marginTop: 10, color: '#764094'}}>Loading fonts...</Text>
        </View>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet visible={visible} onDismiss={onDismiss} fullHeight={true}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header with white background */}
        <View style={styles.headerContainer}>
          <View style={styles.headerBackground}>
            {/* Status bar spacing */}
            <View style={styles.statusBarSpace} />
            
            {/* Stylized title display that looks like handwriting */}
            <TextInput
              style={[styles.logoText, { fontFamily: 'GreatVibes-Regular' }]}
              placeholder="Entry Title"
              placeholderTextColor="rgba(118, 64, 148, 0.5)"
              value={title}
              onChangeText={(text) => {
                // Ensure clean input and prevent unexpected behavior
                const cleanedText = text.replace(/\s+/g, ' ').trim();
                setTitle(cleanedText);
                setIsDirty(true);
              }}
              numberOfLines={2}
              returnKeyType="done"
              blurOnSubmit={true}
              autoCorrect={false}
              spellCheck={false}
            />
            
            {/* Extra spacing */}
            <View style={{height: 5}} />
            {/* Decorative line under title */}
            <View style={styles.decorativeLine} />
          </View>
        </View>

        <View style={styles.contentContainer}>
          {/* Entry type selection */}
          <View style={styles.entryTypeContainer}>
            <TouchableOpacity
              style={[
                styles.entryTypeButton,
                currentEntryType === 'on_demand' && styles.selectedEntryType,
              ]}
              onPress={() => setCurrentEntryType('on_demand')}
            >
              <View style={styles.entryTypeContent}>
                {currentEntryType === 'on_demand' && (
                  <Text style={styles.checkMark}>✓</Text>
                )}
                <Text
                  style={[
                    styles.entryTypeText,
                    currentEntryType === 'on_demand' && styles.selectedEntryTypeText,
                  ]}
                >
                  Free Write
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.entryTypeButton,
                currentEntryType === 'daily_prompt' && styles.selectedEntryType,
              ]}
              onPress={() => {
                setCurrentEntryType('daily_prompt');
                if (!selectedPrompt) {
                  selectRandomPrompt();
                }
              }}
            >
              <View style={styles.entryTypeContent}>
                {currentEntryType === 'daily_prompt' && (
                  <Text style={styles.checkMark}>✓</Text>
                )}
                <Text
                  style={[
                    styles.entryTypeText,
                    currentEntryType === 'daily_prompt' && styles.selectedEntryTypeText,
                  ]}
                >
                  With Prompt
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Prompt Card */}
          {currentEntryType === 'daily_prompt' && (
            <Card style={styles.promptCard} mode="outlined">
              <Card.Content>
                {selectedPrompt ? (
                  <>
                    <Text style={styles.promptText}>"{selectedPrompt.question}"</Text>
                    <Button 
                      mode="text" 
                      icon="refresh" 
                      onPress={selectRandomPrompt}
                      style={styles.promptButton}
                      textColor="#764094"
                    >
                      Try Another
                    </Button>
                  </>
                ) : (
                  <>
                    <Text style={styles.promptPlaceholder}>Select a writing prompt to inspire your entry</Text>
                    <Button 
                      mode="text" 
                      icon="lightbulb-outline" 
                      onPress={selectRandomPrompt}
                      style={styles.promptButton}
                      textColor="#764094"
                    >
                      Get Prompt
                    </Button>
                  </>
                )}
              </Card.Content>
            </Card>
          )}
          
          {/* Text Editor */}
          <View style={styles.editorContainer}>
            <RichTextEditor
              ref={editorRef}
              onChange={handleContentChange}
              initialContent=""
              placeholder="What's on your mind today?"
              minHeight={180}
            />
          </View>

          {/* Mood selection section */}
          <Text style={styles.moodLabel}>How are you feeling?</Text>
          <View style={styles.moodButtonsContainer}>
            {(['happy', 'excited', 'calm', 'neutral'] as Mood[]).map((moodOption) => (
              <TouchableOpacity
                key={moodOption}
                style={[
                  styles.moodButton,
                  mood === moodOption && styles.selectedMoodButton,
                ]}
                onPress={() => setMood(moodOption)}
              >
                <Text style={styles.moodEmoji}>{getMoodEmoji(moodOption)}</Text>
                <Text style={styles.moodButtonText}>{moodOption}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Divider style={styles.divider} />
          
          {/* Tags Input with AI Suggestions */}
          <TagsInput 
            tags={tags}
            onTagsChange={setTags}
            content={content}
          />
          
          <Divider style={styles.divider} />
          
          {/* Submit Button */}
          <Button 
            mode="contained" 
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!content.trim() || isSubmitting}
            style={styles.submitButton}
            buttonColor="#764094"
            icon="check"
          >
            Save Entry
          </Button>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Extra padding at bottom to ensure save button is visible
  },
  divider: {
    marginVertical: 16,
    backgroundColor: '#eee',
  },
  headerContainer: {
    height: 130,
    overflow: 'hidden',
    marginTop: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerBackground: {
    flex: 1,
    padding: 16, 
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  statusBarSpace: {
    height: 25, // Balanced to prevent cropping while not having too much space
  },
  logoText: {
    color: '#764094', // Purple title text
    fontSize: 42,
    fontFamily: 'GreatVibes-Regular',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
    minHeight: 70,
    maxHeight: 100,
    width: '90%',
    paddingHorizontal: 10,
    paddingBottom: 5,
    // Subtle text shadow for elegance
    textShadowColor: 'rgba(118, 64, 148, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  decorativeLine: {
    width: '80%',
    height: 2,
    backgroundColor: '#764094',
    marginTop: 5,
    opacity: 0.4,
    borderRadius: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 50, // Reduced padding as we have it in scrollContent
  },
  entryTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    marginTop: 6,
  },
  entryTypeButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 25,
    height: 42,
    minWidth: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryTypeText: {
    color: '#555',
    fontSize: 15,
  },
  selectedEntryType: {
    backgroundColor: 'rgba(118, 64, 148, 0.2)',
    borderColor: '#9157b3',
  },
  selectedEntryTypeText: {
    color: '#764094',
    fontWeight: '500',
  },
  checkMark: {
    color: '#764094',
    marginRight: 5,
    fontSize: 16,
  },
  promptCard: {
    marginBottom: 20,
    backgroundColor: 'rgba(118, 64, 148, 0.05)',
    borderColor: 'rgba(118, 64, 148, 0.2)',
  },
  promptText: {
    fontStyle: 'italic',
    marginBottom: 12,
    color: '#333',
    fontSize: 16,
    lineHeight: 24,
  },
  promptPlaceholder: {
    color: '#666',
    marginBottom: 12,
  },
  promptButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  editorContainer: {
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20,
    height: 250, // Increased height for the editor
  },
  moodLabel: {
    fontSize: 18,
    fontWeight: '400',
    color: '#764094',
    marginTop: 20,
    marginBottom: 10,
  },
  moodButtonsContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  moodButton: {
    backgroundColor: '#eaeaea',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    marginBottom: 12,
    alignItems: 'center',
  },
  selectedMoodButton: {
    backgroundColor: '#e0d0f0', // Light purple for selection
  },
  moodEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  moodButtonText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '400',
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 60, // Extra margin to ensure button is visible
    borderRadius: 25,
    paddingVertical: 8,
  },
});
