import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import {
  Text,
  Button,
  useTheme,
  ActivityIndicator,
  Surface,
  TouchableRipple,
  Avatar,
  Divider,
  FAB,
  Portal,
  Snackbar,
  Chip,
  Card,
  IconButton,
  Tooltip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useJournal } from '../../../hooks/useJournal';
import { JournalEntry, Mood, JournalEntryType } from '../../../types/journal';
import { CreateEntrySheet } from '../../../components/journal/CreateEntrySheet';
import { EditEntrySheet } from '../../../components/journal/EditEntrySheet';
import { MoodPicker } from '../../../components/journal/MoodPicker';
import { PhysicalJournalCapture } from '../../../components/journal/PhysicalJournalCapture';
import { StatusBarHeight } from '../../../utils/dimensions';
import { format } from 'date-fns';

export default function JournalScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showPhysicalCapture, setShowPhysicalCapture] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [currentMood, setCurrentMood] = useState<Mood>('neutral');
  const [fabOpen, setFabOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [todayPrompt, setTodayPrompt] = useState("What brings you joy and fulfillment today?");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAllTags, setShowAllTags] = useState(false);
  
  const { entries, addEntry, updateEntry, deleteEntry, loadEntries, loading } = useJournal();
  
  // Array of weekdays for mood timeline
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Today'];
  
  // Get moods for the past week
  const weekdayMoods = weekdays.map((day, index) => {
    // For demo, we'll hardcode Wed as having entries
    if (day === 'Wed') {
      return { day, mood: 'happy' as Mood, hasEntries: true };
    }
    return { day, mood: 'neutral' as Mood, hasEntries: false };
  });

  // Extract unique tags from all entries for filtering
  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach(entry => {
      entry.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [entries]);
  
  // Filter entries by selected tags if any
  const filteredEntries = React.useMemo(() => {
    if (selectedTags.length === 0) return entries;
    
    return entries.filter(entry => 
      selectedTags.some(tag => entry.tags?.includes(tag))
    );
  }, [entries, selectedTags]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadEntries();
    } catch (error) {
      console.error('Error refreshing entries:', error);
      showMessage('Could not refresh entries');
    } finally {
      setRefreshing(false);
    }
  };

  const showMessage = (message: string) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
  };

  const handleCreateEntry = async (data: {
    content: string;
    mood: Mood;
    tags: string[];
    entry_type: JournalEntryType;
    prompt_id?: string;
  }) => {
    try {
      await addEntry(data);
      setShowCreateSheet(false);
      showMessage('Entry added successfully! 📝');
    } catch (error) {
      console.error('Error creating entry:', error);
      showMessage('Could not save entry');
    }
  };

  const handleUpdateEntry = async (id: string, data: {
    content: string;
    title?: string;
    mood: Mood;
    tags: string[];
    entry_type: JournalEntryType;
    prompt_id?: string;
  }) => {
    try {
      await updateEntry(id, data);
      setShowEditSheet(false);
      setSelectedEntry(null);
      showMessage('Entry updated successfully! ✅');
    } catch (error) {
      console.error('Error updating entry:', error);
      showMessage('Could not update entry');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await deleteEntry(id);
      setShowEditSheet(false);
      setSelectedEntry(null);
      showMessage('Entry deleted successfully');
    } catch (error) {
      console.error('Error deleting entry:', error);
      showMessage('Could not delete entry');
    }
  };

  const renderMoodEmoji = (mood: Mood) => {
    const emojiMap: Record<Mood, string> = {
      'happy': '😊',
      'sad': '😢',
      'anxious': '😟',
      'neutral': '😐',
      'excited': '🤩',
      'calm': '😌'
    };
    return <Text style={styles.moodEmoji}>{emojiMap[mood]}</Text>;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
        <View style={styles.headerButtons}>
          <Tooltip title="Continuous Journals">
            <IconButton 
              icon="book-open-variant" 
              size={24} 
              onPress={() => router.push('/(authenticated)/journal/series')}
            />
          </Tooltip>
          <IconButton 
            icon="cog-outline" 
            size={24} 
            onPress={() => {}}
          />
        </View>
      </View>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Today's Prompt Card */}
        <View style={styles.section}>
          <Card style={styles.todayCard}>
            <Card.Content>
              <Text style={styles.todayTitle}>Today's Reflection</Text>
              <Text style={styles.promptText}>"{todayPrompt}"</Text>
              <Button 
                mode="contained" 
                icon="pencil" 
                onPress={() => {
                  setCurrentMood('neutral');
                  setShowCreateSheet(true);
                }}
                style={styles.startWritingButton}
              >
                Start Writing
              </Button>
            </Card.Content>
          </Card>
        </View>
        
        {/* Mood Timeline Section */}
        <View style={styles.section}>
          <Card style={styles.moodCard}>
            <Card.Content>
              <Text style={styles.moodTitle}>Mood Timeline</Text>
              <View style={styles.moodTimeline}>
                {weekdayMoods.map((item, index) => (
                  <View key={item.day} style={styles.moodDay}>
                    <View style={[styles.moodEmoji, item.day === 'Wed' ? styles.activeMoodDay : null]}>
                      {renderMoodEmoji(item.mood)}
                      {item.day === 'Wed' && <View style={styles.entryDot} />}
                    </View>
                    <Text style={[styles.dayText, item.day === 'Today' ? styles.todayText : null]}>
                      {item.day}
                    </Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        </View>
        
        {/* Recent Entries Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Entries</Text>
            <Button mode="text" onPress={() => {}}>View All</Button>
          </View>
          
          {/* Tag Filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.tagFilterContainer}
            contentContainerStyle={styles.tagFilterContent}
          >
            {selectedTags.length > 0 && (
              <Chip 
                mode="outlined" 
                onPress={() => setSelectedTags([])} 
                style={styles.clearFilterChip}
                closeIcon="close-circle"
                onClose={() => setSelectedTags([])}
              >
                Clear filters
              </Chip>
            )}
            
            {(showAllTags ? allTags : allTags.slice(0, 5)).map(tag => (
              <Chip
                key={tag}
                mode={selectedTags.includes(tag) ? "flat" : "outlined"}
                selected={selectedTags.includes(tag)}
                onPress={() => {
                  if (selectedTags.includes(tag)) {
                    setSelectedTags(selectedTags.filter(t => t !== tag));
                  } else {
                    setSelectedTags([...selectedTags, tag]);
                  }
                }}
                style={styles.filterChip}
              >
                {tag}
              </Chip>
            ))}
            
            {allTags.length > 5 && (
              <Chip
                mode="outlined"
                onPress={() => setShowAllTags(!showAllTags)}
                style={styles.moreTagsChip}
                icon={showAllTags ? "chevron-up" : "chevron-down"}
              >
                {showAllTags ? "Less" : `+${allTags.length - 5} more`}
              </Chip>
            )}
          </ScrollView>
          
          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
          ) : filteredEntries.length === 0 ? (
            <Card>
              <Card.Content style={styles.emptyEntriesContent}>
                {entries.length === 0 ? (
                  <>
                    <Avatar.Icon size={60} icon="book-open-variant" style={styles.emptyIcon} />
                    <Text style={styles.emptyText}>No entries yet</Text>
                    <Text style={styles.emptySubtext}>Start writing to see your entries here</Text>
                  </>
                ) : (
                  <>
                    <Avatar.Icon size={60} icon="filter-variant-remove" style={styles.emptyIcon} />
                    <Text style={styles.emptyText}>No matching entries</Text>
                    <Text style={styles.emptySubtext}>Try different tag filters</Text>
                  </>
                )}
              </Card.Content>
            </Card>
          ) : (
            filteredEntries.slice(0, 4).map(entry => (
              <Card 
                key={entry.id} 
                style={styles.entryItem}
                onPress={() => {
                  setSelectedEntry(entry);
                  setShowEditSheet(true);
                }}
              >
                <Card.Content>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryDate}>
                      {format(new Date(entry.created_at), 'MMMM d, yyyy')}
                    </Text>
                    <Chip compact icon="emoticon" style={{backgroundColor: theme.colors.surfaceVariant}}>{entry.mood}</Chip>
                  </View>
                  <Text style={styles.entryTitle} numberOfLines={1}>
                    {entry.title || entry.content.split('\n')[0]}
                  </Text>
                  <Text style={styles.entryContent} numberOfLines={2}>
                    {entry.content.replace(/<[^>]*>?/gm, '').substring(0, 120)}
                    {entry.content.length > 120 ? '...' : ''}
                  </Text>
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
      
      <Portal>
        <CreateEntrySheet
          visible={showCreateSheet}
          onDismiss={() => setShowCreateSheet(false)}
          onSubmit={handleCreateEntry}
        />
        
        {selectedEntry && (
          <EditEntrySheet
            visible={showEditSheet}
            onDismiss={() => {
              setShowEditSheet(false);
              setSelectedEntry(null);
            }}
            entry={selectedEntry}
            onSubmit={handleUpdateEntry}
            onDelete={() => selectedEntry && handleDeleteEntry(selectedEntry.id)}
          />
        )}
        
        <MoodPicker
          visible={showMoodPicker}
          onDismiss={() => setShowMoodPicker(false)}
          initialMood={currentMood}
          onSelectMood={(mood) => {
            setCurrentMood(mood);
            setShowMoodPicker(false);
          }}
        />
        
        <PhysicalJournalCapture
          visible={showPhysicalCapture}
          onClose={() => setShowPhysicalCapture(false)}
          onDismiss={() => setShowPhysicalCapture(false)}
          onTextRecognized={() => {}}
          onCapture={(content) => {
            handleCreateEntry({
              content,
              mood: currentMood,
              tags: [],
              entry_type: 'on_demand'
            });
            setShowPhysicalCapture(false);
          }}
        />
        
        <FAB.Group
          open={fabOpen}
          visible
          icon={fabOpen ? 'close' : 'plus'}
          actions={[
            {
              icon: 'text-box-plus',
              label: 'New Entry',
              onPress: () => {
                setCurrentMood('neutral');
                setShowCreateSheet(true);
              },
            },
            {
              icon: 'emoticon-outline',
              label: 'Log Mood',
              onPress: () => setShowMoodPicker(true),
            },
            {
              icon: 'camera',
              label: 'Capture Journal',
              onPress: () => setShowPhysicalCapture(true),
            },
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
          onPress={() => {
            if (fabOpen) {
              // Close FAB menu
            }
          }}
          style={styles.fab}
        />
        
        <Snackbar
          visible={showSnackbar}
          onDismiss={() => setShowSnackbar(false)}
          duration={3000}
          style={styles.snackbar}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100, // Provide enough padding for the FAB
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: StatusBarHeight + 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#764094', // Purple theme
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  tagFilterContainer: {
    marginBottom: 16,
  },
  tagFilterContent: {
    paddingRight: 16,
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  clearFilterChip: {
    marginRight: 8,
    borderColor: 'rgba(199, 57, 75, 0.5)',
    backgroundColor: 'rgba(199, 57, 75, 0.1)',
  },
  moreTagsChip: {
    marginRight: 8,
    borderStyle: 'dashed',
  },
  todayCard: {
    borderRadius: 16,
    marginTop: 8,
  },
  todayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#764094',
  },
  promptText: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 16,
    lineHeight: 24,
  },
  startWritingButton: {
    borderRadius: 24,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  moodCard: {
    borderRadius: 16,
  },
  moodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#764094',
  },
  moodTimeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  moodDay: {
    alignItems: 'center',
    width: 45,
  },
  moodEmoji: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    fontSize: 20,
  },
  activeMoodDay: {
    backgroundColor: 'rgba(118, 64, 148, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(118, 64, 148, 0.3)',
  },
  entryDot: {
    position: 'absolute',
    bottom: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#764094',
  },
  dayText: {
    fontSize: 12,
    color: '#666',
  },
  todayText: {
    fontWeight: 'bold',
    color: '#764094',
  },
  entryItem: {
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#764094',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryDate: {
    fontSize: 12,
    color: '#666',
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  entryContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyEntriesContent: {
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    backgroundColor: 'rgba(118, 64, 148, 0.1)',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  snackbar: {
    marginBottom: 100,
  },
});
