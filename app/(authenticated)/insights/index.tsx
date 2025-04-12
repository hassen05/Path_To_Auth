import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { 
  Text, 
  Card, 
  Chip, 
  useTheme, 
  Button, 
  Divider, 
  IconButton, 
  Searchbar, 
  SegmentedButtons, 
  ActivityIndicator, 
  MD3Theme, 
  FAB, 
  Snackbar 
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useJournal } from '../../../hooks/useJournal';
import { AIInsight, JournalEntry } from '../../../types/journal';
import { formatDistanceToNow, format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import JournalChatView from '../../../components/journal/JournalChatView';

type InsightViewMode = 'chat' | 'bookmarked';

export default function InsightsScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { entries, insights, bookmarkInsight, generateInsight, insightsLoading } = useJournal();
  
  // State management
  const [viewMode, setViewMode] = useState<InsightViewMode>('chat');
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  
  // Filter insights based on search query (bookmarked only)
  const filteredInsights = useMemo(() => {
    // Start with bookmarked insights only
    const filtered = insights.filter(insight => insight.is_bookmarked);
    
    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return filtered.filter(insight => 
        insight.content.toLowerCase().includes(query) || 
        (insight.emotional_patterns && insight.emotional_patterns.toLowerCase().includes(query)) ||
        (insight.actionable_steps && insight.actionable_steps.some(step => 
          step.toLowerCase().includes(query)
        )) ||
        (insight.affirmation && insight.affirmation.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [insights, searchQuery]);
  
  // Show snackbar message
  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);
  
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
  }, [bookmarkInsight, showSnackbar]);
  
  // Generate a new insight from recent entries
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
  }, [entries, generateInsight, showSnackbar]);
  
  // Get related entries for an insight
  const getRelatedEntries = useCallback((insight: AIInsight) => {
    return entries.filter(entry => insight.entry_ids.includes(entry.id));
  }, [entries]);
  
  // Render insight card
  const renderInsightCard = useCallback(({ item }: { item: AIInsight }) => {
    const relatedEntries = getRelatedEntries(item);
    
    return (
      <Card style={styles.insightCard} mode="outlined">
        <Card.Content>
          <Text style={styles.insightDate}>
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </Text>
          <Text style={styles.insightContent}>{item.content}</Text>
          
          {item.emotional_patterns && (
            <View style={styles.patternContainer}>
              <Text style={styles.sectionTitle}>Emotional Patterns</Text>
              <Text style={styles.patternText}>{item.emotional_patterns}</Text>
            </View>
          )}
          
          {item.actionable_steps && item.actionable_steps.length > 0 && (
            <View style={styles.stepsContainer}>
              <Text style={styles.sectionTitle}>Actionable Steps</Text>
              {item.actionable_steps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          )}
          
          {item.affirmation && (
            <View style={styles.affirmationContainer}>
              <Text style={styles.sectionTitle}>Affirmation</Text>
              <Text style={styles.affirmationText}>"{item.affirmation}"</Text>
            </View>
          )}
          
          {relatedEntries.length > 0 && (
            <View style={styles.relatedContainer}>
              <Text style={styles.sectionTitle}>Based on</Text>
              <FlatList
                horizontal
                data={relatedEntries}
                keyExtractor={(entry) => entry.id}
                renderItem={({ item: entry }) => (
                  <Chip 
                    style={styles.relatedChip}
                    icon="calendar"
                    mode="outlined"
                  >
                    {format(new Date(entry.created_at), 'MMM d')} • {entry.mood}
                  </Chip>
                )}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}
        </Card.Content>
        
        <Card.Actions>
          <Button 
            icon={item.is_bookmarked ? "bookmark" : "bookmark-outline"}
            onPress={() => handleBookmarkToggle(item)}
            mode="text"
          >
            {item.is_bookmarked ? "Bookmarked" : "Bookmark"}
          </Button>
        </Card.Actions>
      </Card>
    );
  }, [getRelatedEntries, handleBookmarkToggle, styles]);
  
  // Empty state for insights
  const renderEmptyInsights = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No insights yet</Text>
      <Text style={styles.emptyText}>
        Generate AI insights based on your journal entries to discover patterns and get personalized reflections.
      </Text>
      <Button 
        mode="contained" 
        onPress={handleGenerateInsight}
        loading={isGeneratingInsight}
        disabled={isGeneratingInsight}
        style={styles.generateButton}
      >
        Generate Insight
      </Button>
    </View>
  ), [handleGenerateInsight, isGeneratingInsight, styles]);
  
  // Empty state for bookmarks
  const renderEmptyBookmarks = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No bookmarked insights</Text>
      <Text style={styles.emptyText}>
        Generate insights and bookmark the valuable ones to reference them here.
      </Text>
      <Button 
        mode="contained" 
        onPress={handleGenerateInsight}
        loading={isGeneratingInsight}
        disabled={isGeneratingInsight || entries.length < 3}
        style={styles.generateButton}
      >
        Generate New Insight
      </Button>
    </View>
  ), [styles, handleGenerateInsight, isGeneratingInsight, entries.length]);
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
        <View style={styles.segmentedContainer}>
          <SegmentedButtons
            value={viewMode}
            onValueChange={(value) => setViewMode(value as InsightViewMode)}
            buttons={[
              { value: 'chat', label: 'Chat' },
              { value: 'bookmarked', label: 'Bookmarked' },
            ]}
          />
        </View>
      </View>
      
      {viewMode !== 'chat' && (
        <Searchbar
          placeholder="Search insights..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          mode="bar"
        />
      )}
      
      {viewMode === 'chat' ? (
        // Chat view using dedicated component
        <JournalChatView 
          entries={entries} 
          onShowSnackbar={showSnackbar}
        />
      ) : insightsLoading ? (
        // Loading view
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading insights...</Text>
        </View>
      ) : filteredInsights.length > 0 ? (
        // Insights list
        <FlatList
          data={filteredInsights}
          renderItem={renderInsightCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        // Empty state for bookmarks
        renderEmptyBookmarks()
      )}
      
      {viewMode !== 'chat' && (
        <FAB
          icon="lightbulb"
          style={styles.fab}
          onPress={handleGenerateInsight}
          loading={isGeneratingInsight}
          disabled={isGeneratingInsight || entries.length < 3}
        />
      )}
      
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

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 16,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    fontSize: 28,
    marginBottom: 16,
  },
  segmentedContainer: {
    width: '100%',
  },
  searchbar: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Space for FAB
  },
  insightCard: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.outlineVariant,
  },
  insightDate: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  insightContent: {
    fontSize: 16,
    color: theme.colors.onSurface,
    marginBottom: 16,
    lineHeight: 24,
  },
  patternContainer: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  patternText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  stepsContainer: {
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primaryContainer,
    color: theme.colors.onPrimaryContainer,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 20,
    marginRight: 8,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.onSurface,
    lineHeight: 20,
  },
  affirmationContainer: {
    marginBottom: 12,
  },
  affirmationText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: theme.colors.onSurface,
    lineHeight: 22,
  },
  relatedContainer: {
    marginTop: 8,
  },
  relatedChip: {
    marginRight: 8,
    marginTop: 4,
    backgroundColor: theme.colors.surfaceVariant,
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
