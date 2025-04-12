import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TextInput, ScrollView, TouchableOpacity, Text, Platform } from 'react-native';
import { useTheme, Button, Card, Chip, Divider, ActivityIndicator } from 'react-native-paper';
import { useFonts } from 'expo-font';
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
  // Load custom GreatVibes font
  const [fontsLoaded] = useFonts({
    'GreatVibes-Regular': require('../../assets/fonts/GreatVibes-Regular.ttf'),
  });
  
  const [content, setContent] = useState(entry.content);
  const [title, setTitle] = useState(entry.title || '');
  // Remove unnecessary isUserEditingTitle and initialTitle state variables
  // which are causing race conditions and complexity

  // When the sheet becomes visible, reset all states to match the entry
  useEffect(() => {
    if (visible) {
      // Reset all state variables when the sheet becomes visible
      setContent(entry.content);
      // Ensure title is a string and trim it
      const cleanTitle = (entry.title || '').trim();
      setTitle(cleanTitle);
      setMood(entry.mood);
      setTags(entry.tags || []);
      setEntryType(entry.entry_type || 'on_demand');
      
      // Handle prompt if needed
      if (entry.prompt_id) {
        const prompt = prompts.find(p => p.id === entry.prompt_id);
        setSelectedPrompt(prompt || null);
      } else {
        setSelectedPrompt(null);
      }
    }
  }, [visible, entry]);

  // No need for title change tracking useEffect

  const [mood, setMood] = useState<Mood>(entry.mood);
  const [tags, setTags] = useState<string[]>(entry.tags || []);
  const [entryType, setEntryType] = useState<JournalEntryType>(entry.entry_type || 'on_demand');
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const theme = useTheme();
  const editorRef = useRef<RichTextEditorRef>(null);
  
  // Show loading indicator if fonts are not yet loaded
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Common emotion tags for quick selection
  const commonTags = [
    'happiness', 'sadness', 'anxiety', 'stress', 'gratitude',
    'growth', 'family', 'work', 'health', 'relationship'
  ];

  // Find the prompt if this entry has one
  const [selectedPrompt, setSelectedPrompt] = useState<JournalPrompt | null>(
    entry.prompt_id ? prompts.find(p => p.id === entry.prompt_id) || null : null
  );

  // Update editor content when visible
  useEffect(() => {
    if (visible && editorRef.current) {
      // Update the editor content with a slight delay to ensure ref is ready
      setTimeout(() => {
        editorRef.current?.setContentHTML(entry.content);
      }, 50);
    }
  }, [visible, entry.content]);

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
      
      // Get content from editor
      let htmlContent = '';
      try {
        htmlContent = await editorRef.current?.getContentHtml() || '';
      } catch (editorError) {
        console.error('Error getting editor content:', editorError);
        // Fallback to content state if editor fails
        htmlContent = content;
      }

      // Ensure we're using the most up-to-date title and it's properly trimmed
      const finalTitle = (title || '').trim();

      // Process the entry submission

      if (htmlContent.trim()) {
        // Make a clone of the entry object and update the properties
        const updatedEntry = {
          content: htmlContent,
          title: finalTitle, // Pass title explicitly
          mood,
          tags,
          entry_type: entryType,
          prompt_id: selectedPrompt?.id
        };

        // Submit the entry
        await onSubmit(entry.id, updatedEntry);
        onDismiss(); // Close the sheet after successful submission
      }
    } catch (error) {
      // Keep the error logging for debugging
      console.error('Error updating entry:', error);
      alert('Failed to update entry. Please try again.');
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
            <View style={styles.titleContainer}>
              <TextInput
                style={styles.titleInput}
                value={title}
                onChangeText={(newTitle) => {
                  // Update title directly
                  // Update title immediately without any conditions
                  setTitle(newTitle);
                }}
                // Remove focus/blur handlers that were causing problems
                placeholder="Entry Title"
                placeholderTextColor="rgba(118, 64, 148, 0.5)"
                multiline={false}
                editable={true}
                autoCapitalize="sentences"
                clearButtonMode="while-editing"
                selectTextOnFocus={false} // Don't auto-select text on focus
                blurOnSubmit={true} // Blur the input when the user presses enter/return
                returnKeyType="done" // Use 'done' as the return key label
              />
            </View>
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
  titleContainer: {
    width: '100%',
    padding: 15,
    marginTop: 10,
  },
  titleInput: {
    fontSize: 36,
    padding: 0,
    marginVertical: 4,
    marginHorizontal: 12,
    minHeight: 50,
    color: '#764094',
    fontFamily: 'GreatVibes-Regular',
    backgroundColor: 'rgba(236, 232, 240, 0.5)',
    borderRadius: 8,
    textAlign: 'center',
    ...Platform.select({
      ios: {
        paddingTop: 10, // Fix for iOS text alignment
      },
      android: {
        textAlignVertical: 'center',
      },
    }),
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
