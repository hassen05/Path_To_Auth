import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, Pressable, ScrollView } from 'react-native';
import { Text, Card, Chip, useTheme, Button, Divider, IconButton, Searchbar, SegmentedButtons, ActivityIndicator, MD3Theme, FAB, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useJournal } from '../../../hooks/useJournal';
import { AIInsight, JournalEntry } from '../../../types/journal';
import { formatDistanceToNow, format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

type InsightViewMode = 'all' | 'bookmarked';

export default function InsightsScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { entries, insights, bookmarkInsight, generateInsight, insightsLoading } = useJournal();
  
  const [viewMode, setViewMode] = useState<InsightViewMode>('all');
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  
  // Filter insights based on view mode and search query
  const filteredInsights = useCallback(() => {
    let filtered = insights;
    
    // Filter by view mode
    if (viewMode === 'bookmarked') {
      filtered = filtered.filter(insight => insight.is_bookmarked);
    }
    
    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(insight => 
        insight.content.toLowerCase().includes(query) || 
        (insight.emotional_patterns && insight.emotional_patterns.toLowerCase().includes(query)) ||
        (insight.actionable_steps && insight.actionable_steps.some(step => 
          step.toLowerCase().includes(query)
        )) ||
        (insight.affirmation && insight.affirmation.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [insights, viewMode, searchQuery]);
  
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };
  
  // Handle bookmark toggle
  const handleBookmarkToggle = useCallback(async (insight: AIInsight) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await bookmarkInsight(insight.id, !insight.is_bookmarked);
      showSnackbar(
        insight.is_bookmarked 
          ? 'Removed from bookmarks' 
          : 'Added to bookmarks'
      );
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      showSnackbar('Failed to update bookmark');
    }
  }, [bookmarkInsight]);
  
  // Generate a new insight from selected entries
  const handleGenerateInsight = useCallback(async () => {
    try {
      setIsGeneratingInsight(true);
      
      // Get the last 10 entries
      const recentEntries = entries.slice(0, 10);
      if (recentEntries.length < 3) {
        showSnackbar('Need at least 3 entries to generate an insight');
        return;
      }
      
      const entryIds = recentEntries.map(entry => entry.id);
      await generateInsight(entryIds);
      showSnackbar('New insight generated');
      
      // Vibrate on success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error generating insight:', error);
      showSnackbar('Failed to generate insight');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsGeneratingInsight(false);
    }
  }, [entries, generateInsight]);
  
  // Find related entries for an insight
  const getRelatedEntries = useCallback((entryIds: string[]) => {
    return entries.filter(entry => entryIds.includes(entry.id));
  }, [entries]);
  
  // Render each insight card
  const renderInsightItem = useCallback(({ item }: { item: AIInsight }) => {
    const relatedEntries = getRelatedEntries(item.entry_ids);
    const createdDate = new Date(item.created_at);
    
    return (
      <Card style={styles.insightCard} mode="elevated">
        <Card.Content>
          <View style={styles.insightHeader}>
            <Text variant="titleMedium" style={styles.insightTitle}>
              AI Reflection {format(createdDate, 'MMM d')}
            </Text>
            <IconButton
              icon={item.is_bookmarked ? "bookmark" : "bookmark-outline"}
              size={20}
              onPress={() => handleBookmarkToggle(item)}
              style={styles.bookmarkButton}
              iconColor={item.is_bookmarked ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
          </View>
          
          <Text variant="bodyMedium" style={styles.insightContent}>
            {item.content}
          </Text>
          
          {item.emotional_patterns && (
            <>
              <Divider style={styles.divider} />
              <Text variant="titleSmall" style={styles.sectionTitle}>
                Emotional Patterns
              </Text>
              <Text variant="bodyMedium" style={styles.patternText}>
                {item.emotional_patterns}
              </Text>
            </>
          )}
          
          {item.actionable_steps && item.actionable_steps.length > 0 && (
            <>
              <Divider style={styles.divider} />
              <Text variant="titleSmall" style={styles.sectionTitle}>
                Actionable Steps
              </Text>
              {item.actionable_steps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <Text variant="bodyMedium" style={styles.stepText}>
                    • {step}
                  </Text>
                </View>
              ))}
            </>
          )}
          
          {item.affirmation && (
            <>
              <Divider style={styles.divider} />
              <Text variant="titleSmall" style={styles.sectionTitle}>
                Affirmation
              </Text>
              <Text variant="bodyMedium" style={styles.affirmationText}>
                "{item.affirmation}"
              </Text>
            </>
          )}
          
          {/* Related entries section */}
          <Divider style={styles.divider} />
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Based on {relatedEntries.length} Entries
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.relatedEntriesScroll}
          >
            {relatedEntries.map(entry => (
              <Pressable 
                key={entry.id}
                style={styles.relatedEntryChip}
                onPress={() => router.push(`/journal/${entry.id}`)}
              >
                <Text style={styles.relatedEntryDate}>
                  {format(new Date(entry.created_at), 'MMM d')}
                </Text>
                <Text style={styles.relatedEntryEmoji}>
                  {getMoodEmoji(entry.mood)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Card.Content>
      </Card>
    );
  }, [theme, handleBookmarkToggle, getRelatedEntries]);
  
  // Helper to get mood emoji
  const getMoodEmoji = (mood: string): string => {
    const emojis: Record<string, string> = {
      happy: '😊',
      sad: '😔',
      neutral: '😐',
      excited: '🤩',
      anxious: '😰',
      calm: '😌',
    };
    return emojis[mood] || '😐';
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          AI Insights
        </Text>
      </View>
      
      <View style={styles.filterContainer}>
        <Searchbar
          placeholder="Search insights..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        <SegmentedButtons
          value={viewMode}
          onValueChange={(value) => setViewMode(value as InsightViewMode)}
          buttons={[
            { value: 'all', label: 'All Insights' },
            { value: 'bookmarked', label: 'Bookmarked' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>
      
      {insightsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating size="large" />
          <Text style={styles.loadingText}>Loading insights...</Text>
        </View>
      ) : filteredInsights().length > 0 ? (
        <FlatList
          data={filteredInsights()}
          renderItem={renderInsightItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.insightsList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text variant="titleMedium" style={styles.emptyTitle}>
            {viewMode === 'all' 
              ? "You don't have any insights yet"
              : "You haven't bookmarked any insights"}
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            {viewMode === 'all'
              ? "Add more journal entries to receive AI reflections on your emotional patterns and growth."
              : "Bookmark insights that resonate with you to find them easily later."}
          </Text>
          {viewMode === 'all' && entries.length >= 3 && (
            <Button 
              mode="contained"
              onPress={handleGenerateInsight}
              loading={isGeneratingInsight}
              disabled={isGeneratingInsight}
              style={styles.generateButton}
            >
              Generate Insight Now
            </Button>
          )}
        </View>
      )}
      
      {/* FAB for generating new insights */}
      {viewMode === 'all' && filteredInsights().length > 0 && entries.length >= 3 && (
        <FAB
          icon="lightbulb-outline"
          label="Generate New Insight"
          onPress={handleGenerateInsight}
          loading={isGeneratingInsight}
          disabled={isGeneratingInsight}
          style={styles.fab}
        />
      )}
      
      {/* Snackbar for feedback */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

// Create styles with theme support
const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchbar: {
    marginBottom: 12,
    backgroundColor: theme.colors.surfaceVariant,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  insightsList: {
    padding: 16,
    paddingBottom: 80,
  },
  insightCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
  insightContent: {
    marginBottom: 12,
    lineHeight: 22,
  },
  bookmarkButton: {
    margin: 0,
    padding: 0,
  },
  divider: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
    color: theme.colors.secondary,
  },
  patternText: {
    fontStyle: 'italic',
    color: theme.colors.onSurfaceVariant,
  },
  stepItem: {
    marginBottom: 6,
  },
  stepText: {
    color: theme.colors.onSurface,
  },
  affirmationText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 8,
    color: theme.colors.primary,
  },
  relatedEntriesScroll: {
    flexDirection: 'row',
    marginTop: 8,
  },
  relatedEntryChip: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  relatedEntryDate: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginRight: 4,
  },
  relatedEntryEmoji: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    color: theme.colors.onSurfaceVariant,
  },
  generateButton: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.onSurfaceVariant,
  },
  snackbar: {
    bottom: 70,
  },
});
