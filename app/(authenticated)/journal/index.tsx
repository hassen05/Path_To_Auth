import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, ListRenderItem, RefreshControl, Image, Dimensions } from 'react-native';
import { Text, useTheme, Portal, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  SlideInRight,
} from 'react-native-reanimated';

import { useJournal } from '../../../hooks/useJournal';
import { JournalEntry, Mood } from '../../../types/journal';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { CreateEntrySheet } from '../../../components/journal/CreateEntrySheet';
import { EditEntrySheet } from '../../../components/journal/EditEntrySheet';
import { MoodPicker } from '../../../components/journal/MoodPicker';
import { PhysicalJournalCapture } from '../../../components/journal/PhysicalJournalCapture';

const { width } = Dimensions.get('window');
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

function JournalScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { entries, loading, loadEntries, addEntry, updateEntry, deleteEntry } = useJournal();
  
  // State variables
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [currentMood, setCurrentMood] = useState<Mood>('neutral');
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [showPhysicalCapture, setShowPhysicalCapture] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [todayPrompt, setTodayPrompt] = useState("What brings you joy and fulfillment today?");
  const [activeTab, setActiveTab] = useState<'entries' | 'insights' | 'prompts'>('entries');
  
  // Animation values
  const fabSize = useSharedValue(56);
  const fabScale = useSharedValue(1);
  const headerHeight = useSharedValue(200);
  
  // Load entries when component mounts
  useEffect(() => {
    loadEntries();
    
    // Animation for header entrance
    headerHeight.value = withSpring(200, { damping: 20, stiffness: 90 });
  }, []);
  
  // Update filtered entries when entries or selected tags change
  useEffect(() => {
    if (selectedTags.length === 0) {
      setFilteredEntries(entries);
    } else {
      const filtered = entries.filter(entry => 
        selectedTags.some(tag => entry.tags?.includes(tag))
      );
      setFilteredEntries(filtered);
    }
  }, [entries, selectedTags]);
  
  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: headerHeight.value,
    };
  });
  
  const fabAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: fabSize.value,
      height: fabSize.value,
      borderRadius: fabSize.value / 2,
      transform: [{ scale: fabScale.value }],
    };
  });
  
  // Handler functions
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
  
  const handleCreateEntry = async (data) => {
    try {
      await addEntry(data);
      setShowCreateSheet(false);
      showMessage('Entry added successfully! 📝');
    } catch (error) {
      console.error('Error creating entry:', error);
      showMessage('Could not save entry');
    }
  };
  
  const handleUpdateEntry = async (id: string, data) => {
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
  
  const handleFabPress = () => {
    fabScale.value = withTiming(1.1, { duration: 100 }, () => {
      fabScale.value = withTiming(1, { duration: 100 });
    });
    setCurrentMood('neutral');
    setShowCreateSheet(true);
  };
  
  const handleEntryPress = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setShowEditSheet(true);
  };
  
  const getMoodColor = (mood: Mood): string => {
    const moodColors = {
      'happy': '#FFD166',
      'sad': '#70D6FF',
      'anxious': '#FF6B6B',
      'neutral': '#9381FF',
      'excited': '#FF70A6',
      'calm': '#33CA7F'
    };
    return moodColors[mood] || '#9381FF';
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
  
  const formatEntryDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };
  
  // Render item for FlatList
  const renderJournalEntry: ListRenderItem<JournalEntry> = useCallback(({ item, index }) => {
    const hasImage = index % 3 === 0; // Just for demo, in real app check if entry has images
    
    return (
      <Animated.View 
        entering={SlideInRight.delay(index * 50).springify()}
        style={styles.entryContainer}
      >
        <Card
          elevation={2}
          onPress={() => handleEntryPress(item)}
          style={styles.entryCard}
        >
          <View style={styles.entryHeader}>
            <View style={styles.entryMoodContainer}>
              <View 
                style={[styles.moodIndicator, { backgroundColor: getMoodColor(item.mood) }]} 
              />
              <Text style={styles.entryDate}>{formatEntryDate(item.created_at)}</Text>
            </View>
            <MaterialCommunityIcons 
              name="dots-horizontal" 
              size={20} 
              color="#777" 
            />
          </View>
          
          {item.title && <Text style={styles.entryTitle}>{item.title}</Text>}
          
          <Text 
            style={styles.entryContent} 
            numberOfLines={hasImage ? 3 : 6}
          >
            {item.content}
          </Text>
          
          {hasImage && (
            <LinearGradient
              colors={['#f2994a', '#f2c94c']}
              style={styles.entryImage}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="image-outline" size={24} color="white" style={styles.placeholderIcon} />
            </LinearGradient>
          )}
          
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.slice(0, 3).map((tag, idx) => (
                <View key={idx} style={styles.tagChip}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
              {item.tags.length > 3 && (
                <Text style={styles.moreTagsText}>+{item.tags.length - 3}</Text>
              )}
            </View>
          )}
        </Card>
      </Animated.View>
    );
  }, []);
  
  const EmptyList = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyImageContainer}>
        <LinearGradient
          colors={['#8a2387', '#e94057', '#f27121']}
          style={styles.emptyImageGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons name="notebook-outline" size={64} color="white" />
        </LinearGradient>
      </View>
      <Text style={styles.emptyTitle}>Your Journal is Empty</Text>
      <Text style={styles.emptyText}>
        Start your journey of self-discovery by writing your first entry.
      </Text>
      <Button 
        title="Create First Entry"
        variant="gradient"
        gradientColors={['#4568dc', '#b06ab3']}
        onPress={() => setShowCreateSheet(true)}
        style={styles.emptyButton}
        icon={<MaterialCommunityIcons name="pencil" size={20} color="white" />}
      />
    </View>
  );
  
  const renderHeader = () => (
    <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
      <LinearGradient
        colors={['#4568dc', '#b06ab3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTopRow}>
            <Text style={styles.headerTitle}>Journal</Text>
            <MaterialCommunityIcons 
              name="magnify" 
              size={24} 
              color="white" 
              onPress={() => {}}
            />
          </View>
          
          <Text style={styles.headerPrompt}>"{todayPrompt}"</Text>
          
          <Button
            title="Write Now"
            variant="solid"
            onPress={() => setShowCreateSheet(true)}
            style={styles.writeButton}
            icon={<MaterialCommunityIcons name="pencil" size={20} color="white" />}
          />
        </View>
      </LinearGradient>
      
      <View style={styles.moodPreviewContainer}>
        <Text style={styles.moodPreviewTitle}>Weekly Mood</Text>
        <View style={styles.moodPreviewRow}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Today'].map((day, index) => {
            const mood = day === 'Wed' ? 'happy' : 'neutral';
            const hasEntries = day === 'Wed';
            return (
              <View key={day} style={styles.moodPreviewDay}>
                <View 
                  style={[styles.moodPreviewIndicator, { 
                    backgroundColor: hasEntries ? getMoodColor(mood) : '#e0e0e0',
                    transform: [{ scale: hasEntries ? 1 : 0.8 }]
                  }]}
                >
                  {hasEntries && renderMoodEmoji(mood)}
                </View>
                <Text style={styles.moodPreviewDayText}>{day}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      <AnimatedFlatList
        data={filteredEntries as JournalEntry[]}
        renderItem={renderJournalEntry}
        keyExtractor={(item: JournalEntry) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? EmptyList : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            progressBackgroundColor="white"
          />
        }
      />
      
      {/* Floating action button */}
      <Animated.View style={[styles.fabContainer, fabAnimatedStyle]}>
        <LinearGradient
          colors={['#4568dc', '#b06ab3']}
          style={styles.fabGradient}
        >
          <MaterialCommunityIcons 
            name="pencil" 
            size={24} 
            color="white" 
            onPress={handleFabPress}
          />
        </LinearGradient>
      </Animated.View>
      
      {/* Sheets and modals */}
      <CreateEntrySheet
        visible={showCreateSheet}
        onDismiss={() => setShowCreateSheet(false)}
        onSubmit={handleCreateEntry}
        entryType="on_demand"
        initialTags={[]}
      />
      
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
      
      <MoodPicker
        visible={showMoodPicker}
        onDismiss={() => setShowMoodPicker(false)}
        onSelectMood={setCurrentMood}
        initialMood={currentMood}
      />
      
      <PhysicalJournalCapture
        visible={showPhysicalCapture}
        onDismiss={() => setShowPhysicalCapture(false)}
        onClose={() => setShowPhysicalCapture(false)}
        onTextRecognized={(text) => {
          if (selectedEntry) {
            handleUpdateEntry(selectedEntry.id, {
              ...selectedEntry,
              content: selectedEntry.content + '\n\n' + text,
            });
          }
        }}
      />
      
      <Portal>
        <Snackbar
          visible={showSnackbar}
          duration={3000}
          onDismiss={() => setShowSnackbar(false)}
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
    backgroundColor: '#f8f8f8',
  },
  listContainer: {
    paddingBottom: 90,
  },
  headerContainer: {
    overflow: 'hidden',
    marginBottom: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerGradient: {
    padding: 24,
    paddingBottom: 40,
  },
  headerContent: {
    width: '100%',
  },
  headerTopRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerPrompt: {
    fontSize: 18,
    color: 'white',
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  writeButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
  },
  moodPreviewContainer: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  moodPreviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  moodPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodPreviewDay: {
    alignItems: 'center',
  },
  moodPreviewIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  moodPreviewDayText: {
    fontSize: 12,
    color: '#777',
  },
  entryContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  entryCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryMoodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  entryDate: {
    fontSize: 14,
    color: '#777',
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  entryContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
    marginBottom: 12,
  },
  entryImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  moreTagsText: {
    fontSize: 12,
    color: '#666',
    alignSelf: 'center',
  },
  moodEmoji: {
    fontSize: 16,
  },
  fabContainer: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snackbar: {
    bottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
    marginTop: 32,
  },
  emptyImageContainer: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyImageGradient: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.3,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyButton: {
    paddingHorizontal: 32,
  },
  placeholderIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
});

export default JournalScreen;

