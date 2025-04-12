import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TextInput, ScrollView, TouchableOpacity, Text, Platform } from 'react-native';
import { useTheme, Button, Card, Chip, Divider } from 'react-native-paper';
// No longer need LinearGradient for the white header design
import { BottomSheet } from '../common/BottomSheet';
import { JournalEntry, Mood, JournalEntryType, JournalPrompt } from '../../types/journal';
import RichTextEditor, { RichTextEditorRef } from './RichTextEditor';
import { TagsInput } from './TagsInput';

interface EditEntrySheetProps {
  visible: boolean;
  onDismiss: () => void;
  entry: JournalEntry;
  onSubmit: (id: string, data: {
    content: string;
    title?: string;
    mood: Mood;
    tags: string[];
    entry_type: JournalEntryType;
    prompt_id?: string;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  prompts?: JournalPrompt[];
}

export function EditEntrySheet({ visible, onDismiss, entry, onSubmit, onDelete, prompts = [] }: EditEntrySheetProps) {
  const [content, setContent] = useState(entry.content);
  const [title, setTitle] = useState(entry.title || '');
  
  // Ensure title is always in sync with the entry prop
  useEffect(() => {
    setTitle(entry.title || '');
  }, [entry.title]);

  const handleTitleChange = (text: string) => {
    // Trim any extra spaces and ensure clean input
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    setTitle(cleanedText);
  };

  const [mood, setMood] = useState<Mood>(entry.mood);
  const [tags, setTags] = useState<string[]>(entry.tags || []);
  const [entryType, setEntryType] = useState<JournalEntryType>(entry.entry_type || 'on_demand');
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const theme = useTheme();
  const editorRef = useRef<RichTextEditorRef>(null);
  
  // Common emotion tags for quick selection
  const commonTags = [
    'happiness', 'sadness', 'anxiety', 'stress', 'gratitude', 
    'growth', 'family', 'work', 'health', 'relationship'
  ];
  
  // Find the prompt if this entry has one
  const [selectedPrompt, setSelectedPrompt] = useState<JournalPrompt | null>(
    entry.prompt_id ? prompts.find(p => p.id === entry.prompt_id) || null : null
  );
  
  // Set the content when the entry changes
  useEffect(() => {
    if (visible && editorRef.current) {
      editorRef.current.setContentHTML(entry.content);
      handleTitleChange(entry.title || '');
      setMood(entry.mood);
      setTags(entry.tags || []);
      setEntryType(entry.entry_type || 'on_demand');
      if (entry.prompt_id) {
        const prompt = prompts.find(p => p.id === entry.prompt_id);
        setSelectedPrompt(prompt || null);
      }
    }
  }, [visible, entry, prompts]);

  const handleContentChange = (html: string) => {
    setContent(html);
  };
  
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagPress = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    } else {
      handleRemoveTag(tag);
    }
  };
  
  // Helper to get emoji for mood
  const getMoodEmoji = (moodOption: Mood): string => {
    const emojiMap: Record<Mood, string> = {
      happy: '😊',
      excited: '🤩',
      calm: '😌',
      neutral: '😐',
      anxious: '😟',
      sad: '😢'
    };
    return emojiMap[moodOption];
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const htmlContent = await editorRef.current?.getContentHtml() || '';
      
      console.log('Submitting entry with:', {
        id: entry.id,
        content: htmlContent,
        title,
        mood,
        tags,
        entry_type: entryType,
        prompt_id: selectedPrompt?.id
      });
      
      if (htmlContent.trim()) {
        await onSubmit(entry.id, {
          content: htmlContent,
          title,
          mood,
          tags,
          entry_type: entryType,
          prompt_id: selectedPrompt?.id
        });
      }
    } catch (error) {
      console.error('Error updating entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet visible={visible} onDismiss={onDismiss} fullHeight={true}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header with title input */}
        <View style={styles.headerContainer}>
          <View style={styles.headerBackground}>
            {/* Status bar spacing */}
            <View style={styles.statusBarSpace} />
            
            {/* Stylized title display that looks like handwriting */}
            <TextInput
              style={[styles.logoText, { fontFamily: 'GreatVibes-Regular' }]}
              placeholder="Your Title"
              placeholderTextColor="rgba(118, 64, 148, 0.5)"
              value={title}
              onChangeText={(text) => {
                // Ensure clean input and prevent unexpected behavior
                const cleanedText = text.replace(/\s+/g, ' ').trim();
                setTitle(cleanedText);
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
        {/* Prompt Display (if applicable) */}
        {entryType === 'daily_prompt' && selectedPrompt && (
          <Card style={styles.promptCard}>
            <Card.Content>
              <Text style={[styles.promptText, { fontSize: 16, fontWeight: '500' }]}>
                {selectedPrompt.question}
              </Text>
              {/* Reminder about date/time */}
              <Text style={{ fontStyle: 'italic', marginBottom: 10, fontSize: 12, color: '#666' }}>
                Entry from {new Date(entry.created_at).toLocaleDateString()} at {new Date(entry.created_at).toLocaleTimeString()}
              </Text>
            </Card.Content>
          </Card>
        )}
        
        {/* Text Editor */}
        <View style={styles.editorContainer}>
          <RichTextEditor
            ref={editorRef}
            initialContent={entry.content || ''}
            onChange={handleContentChange}
            placeholder={entryType === 'daily_prompt' 
              ? "Reflect on the prompt..." 
              : "What's on your mind?"}
            minHeight={250}
          />
        </View>
        
        {/* Mood Selection */}
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
          disabled={isSubmitting}
          style={styles.button}
          icon="check"
        >
          Update Entry
        </Button>
        
        {onDelete && (
          <Button 
            mode="outlined" 
            onPress={onDelete}
            disabled={isSubmitting}
            style={[styles.button, styles.deleteButton]}
            textColor={theme.colors.error}
            icon="delete"
          >
            Delete Entry
          </Button>
        )}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding at bottom to ensure save button is visible
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
  decorativeLine: {
    width: '80%',
    height: 2,
    backgroundColor: '#764094',
    marginTop: 5,
    opacity: 0.4,
    borderRadius: 1,
  },
  statusBarSpace: {
    height: 25, // Balanced to prevent cropping while not having too much space
  },
  logoText: {
    color: '#764094',
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
    textShadowColor: 'rgba(118, 64, 148, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  promptCard: {
    marginBottom: 16,
  },
  promptText: {
    fontStyle: 'italic',
    marginBottom: 8,
  },
  editorContainer: {
    minHeight: 250,
    marginBottom: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 15,
    color: '#764094',
  },
  moodButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    alignItems: 'center',
    backgroundColor: '#f8f0ff',
    borderRadius: 12,
    padding: 12,
    width: '23%',
    borderWidth: 1,
    borderColor: 'rgba(118, 64, 148, 0.2)',
  },
  selectedMoodButton: {
    backgroundColor: 'rgba(118, 64, 148, 0.15)',
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  moodButtonText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  divider: {
    marginVertical: 16,
    backgroundColor: '#eee',
    alignItems: 'center',
    marginBottom: 16,
  },
  addTagButton: {
    marginLeft: 8,
  },
  button: {
    marginTop: 8,
  },
  deleteButton: {
    marginTop: 16,
    borderColor: 'transparent',
  },
});
