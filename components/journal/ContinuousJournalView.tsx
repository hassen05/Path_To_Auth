import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Card, Button, Divider, IconButton, FAB, Dialog, Portal, TextInput, Menu, useTheme } from 'react-native-paper';
import { useFonts } from 'expo-font';
import { format } from 'date-fns';
import { useJournal, JournalSeries } from '../../hooks/useJournal';
import { JournalEntry, Mood } from '../../types/journal';
import RichTextEditor, { RichTextEditorRef } from './RichTextEditor';
import { TagsInput } from './TagsInput';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { EditEntrySheet } from './EditEntrySheet';

export function ContinuousJournalView() {
  const theme = useTheme();
  const router = useRouter();
  const { seriesId } = useLocalSearchParams<{ seriesId: string }>();
  
  // Use useEffect to handle navigation if seriesId doesn't exist
  useEffect(() => {
    if (!seriesId) {
      router.replace('/(authenticated)/journal');
    }
  }, [seriesId, router]);
  
  // Load custom font
  const [fontsLoaded] = useFonts({
    'GreatVibes-Regular': require('../../assets/fonts/GreatVibes-Regular.ttf'),
  });
  
  const { 
    series, 
    entries,
    loadSeries,
    getContinuousEntries,
    addContinuousEntry,
    updateEntry,
    deleteEntry,
  } = useJournal();
  
  const [newEntryContent, setNewEntryContent] = useState('');
  const [editorVisible, setEditorVisible] = useState(false);
  const [mood, setMood] = useState<Mood>('neutral');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [isEditSheetVisible, setIsEditSheetVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  
  const editorRef = useRef<RichTextEditorRef>(null);
  
  // Find the current journal series
  const currentSeries = series.find(s => s.id === seriesId);
  const journalEntries = getContinuousEntries(seriesId);
  
  // Load series if it's not found
  useEffect(() => {
    if (!currentSeries) {
      loadSeries();
    }
  }, [seriesId, currentSeries, loadSeries]);
  
  const handleAddEntry = async () => {
    if (!editorRef.current || submitting) return;
    
    try {
      setSubmitting(true);
      const htmlContent = await editorRef.current.getContentHtml();
      
      if (!htmlContent.trim()) {
        return;
      }
      
      await addContinuousEntry(seriesId, {
        content: htmlContent,
        mood,
        tags,
      });
      
      // Reset the editor and state
      setNewEntryContent('');
      setEditorVisible(false);
      editorRef.current.setContentHTML('');
      setMood('neutral');
      setTags([]);
      
    } catch (error) {
      console.error('Error adding entry:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setIsEditSheetVisible(true);
  };
  
  const handleDeleteEntry = async (entryId: string) => {
    try {
      await deleteEntry(entryId);
      setMenuVisible(null);
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };
  
  const handleUpdateEntry = async (id: string, data: any) => {
    await updateEntry(id, data);
    setIsEditSheetVisible(false);
    setEditingEntry(null);
  };
  
  // Show loading if fonts or series data isn't loaded
  if (!fontsLoaded || !currentSeries) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  // Helper to get emoji for mood
  const getMoodEmoji = (moodOption: Mood): string => {
    const emojiMap: Record<Mood, string> = {
      happy: '😊',
      sad: '😢',
      neutral: '😐',
      excited: '🤩',
      anxious: '😟',
      calm: '😌'
    };
    return emojiMap[moodOption];
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => router.back()}
        />
        <Text style={styles.headerTitle}>{currentSeries.title}</Text>
      </View>
      
      {currentSeries.description && (
        <Card style={styles.descriptionCard}>
          <Card.Content>
            <Text>{currentSeries.description}</Text>
          </Card.Content>
        </Card>
      )}
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {journalEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No entries yet</Text>
            <Text style={styles.emptySubtext}>
              Start writing in your continuous journal by tapping the '+' button below.
            </Text>
          </View>
        ) : (
          journalEntries.map((entry, index) => (
            <Card key={entry.id} style={styles.entryCard}>
              <Card.Content>
                <View style={styles.entryHeader}>
                  <View style={styles.entryMeta}>
                    <Text style={styles.entryDate}>
                      {format(new Date(entry.created_at), 'MMMM d, yyyy')}
                    </Text>
                    <Text style={styles.entryTime}>
                      {format(new Date(entry.created_at), 'h:mm a')}
                    </Text>
                    <Text style={styles.moodEmoji}>{getMoodEmoji(entry.mood)}</Text>
                  </View>
                  <Menu
                    visible={menuVisible === entry.id}
                    onDismiss={() => setMenuVisible(null)}
                    anchor={
                      <IconButton
                        icon="dots-vertical"
                        onPress={() => setMenuVisible(entry.id)}
                      />
                    }
                  >
                    <Menu.Item 
                      onPress={() => {
                        setMenuVisible(null);
                        handleEditEntry(entry);
                      }} 
                      title="Edit" 
                      leadingIcon="pencil"
                    />
                    <Divider />
                    <Menu.Item 
                      onPress={() => handleDeleteEntry(entry.id)} 
                      title="Delete" 
                      leadingIcon="delete"
                    />
                  </Menu>
                </View>
                
                <Divider style={{ marginVertical: 8 }} />
                
                <View style={styles.entryContent}>
                  <Text selectable>
                    {entry.content.replace(/<[^>]*>/g, '')}
                  </Text>
                </View>
                
                {entry.tags && entry.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {entry.tags.map(tag => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        )}
        
        {editorVisible && (
          <Card style={styles.editorCard}>
            <Card.Content>
              <View style={styles.editorHeader}>
                <Text style={styles.editorTitle}>New Entry</Text>
                <IconButton
                  icon="close"
                  size={20}
                  onPress={() => setEditorVisible(false)}
                />
              </View>
              
              <View style={styles.editor}>
                <RichTextEditor
                  ref={editorRef}
                  initialContent={newEntryContent}
                  onChange={setNewEntryContent}
                  placeholder="Write your thoughts here..."
                  minHeight={200}
                />
              </View>
              
              <View style={styles.editorControls}>
                <View style={styles.moodSelector}>
                  <Text style={styles.moodLabel}>Mood:</Text>
                  <View style={styles.moods}>
                    {['happy', 'excited', 'calm', 'neutral', 'anxious', 'sad'].map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.moodItem,
                          mood === m && styles.selectedMood
                        ]}
                        onPress={() => setMood(m as Mood)}
                      >
                        <Text style={styles.moodEmoji}>{getMoodEmoji(m as Mood)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <TagsInput
                  tags={tags}
                  onTagsChange={setTags}
                  content={newEntryContent}
                />
                
                <Button
                  mode="contained"
                  onPress={handleAddEntry}
                  loading={submitting}
                  disabled={submitting}
                  style={styles.submitButton}
                >
                  Add to Journal
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
      
      {!editorVisible && (
        <FAB
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          icon="plus"
          onPress={() => setEditorVisible(true)}
        />
      )}
      
      {/* Edit Entry Sheet */}
      {editingEntry && (
        <EditEntrySheet
          visible={isEditSheetVisible}
          onDismiss={() => setIsEditSheetVisible(false)}
          entry={editingEntry}
          onSubmit={handleUpdateEntry}
          onDelete={() => editingEntry && handleDeleteEntry(editingEntry.id)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  descriptionCard: {
    margin: 16,
    marginTop: 0,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySubtext: {
    textAlign: 'center',
    marginTop: 8,
    color: '#666',
  },
  entryCard: {
    marginBottom: 16,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryDate: {
    fontWeight: 'bold',
  },
  entryTime: {
    marginLeft: 8,
    color: '#888',
  },
  moodEmoji: {
    fontSize: 18,
    marginLeft: 8,
  },
  entryContent: {
    marginTop: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  editorCard: {
    marginTop: 16,
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  editor: {
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 8,
  },
  editorControls: {
    marginTop: 16,
  },
  moodSelector: {
    marginBottom: 16,
  },
  moodLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  moods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  selectedMood: {
    backgroundColor: '#e0e0ff',
    borderWidth: 2,
    borderColor: '#6060ff',
  },
  submitButton: {
    marginTop: 16,
  },
});
