import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { Text, Card, Chip, useTheme, Divider, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useJournal } from '../../../hooks/useJournal';
import { JournalEntry, Mood } from '../../../types/journal';
import { format, parseISO, subDays, startOfMonth, endOfMonth } from 'date-fns';

const { width } = Dimensions.get('window');

// Converts mood to a numerical value for graphing
const moodToValue = (mood: Mood): number => {
  const moodMap: Record<string, number> = {
    'sad': 1,
    'anxious': 2,
    'neutral': 3,
    'calm': 4,
    'happy': 5,
    'excited': 5
  };
  return moodMap[mood] || 3; // Default to neutral if mood not found
};

// Converts numerical value back to mood
const valueToMood = (value: number): Mood => {
  const values: Record<number, Mood> = {
    1: 'sad',
    2: 'anxious',
    3: 'neutral',
    4: 'calm',
    5: 'happy'
  };
  return values[Math.round(value) as keyof typeof values] || 'neutral';
};

// Get mood color based on mood value
const getMoodColor = (mood: Mood, theme: any): string => {
  const colorMap: Record<string, string> = {
    'sad': theme.colors.error,
    'anxious': theme.colors.errorContainer,
    'neutral': theme.colors.outline,
    'calm': theme.colors.secondaryContainer,
    'happy': theme.colors.primary,
    'excited': theme.colors.primary
  };
  return colorMap[mood] || theme.colors.outline;
};

// Get emoji for mood
const getMoodEmoji = (mood: Mood): string => {
  const emojiMap: Record<string, string> = {
    'sad': '😢',
    'anxious': '😕',
    'neutral': '😐',
    'calm': '🙂',
    'happy': '😃',
    'excited': '🤩'
  };
  return emojiMap[mood] || '😐';
};

// Time periods for filtering
type TimePeriod = 'week' | 'month' | 'year' | 'all';

export default function ProgressScreen() {
  const theme = useTheme();
  const { entries, loading } = useJournal();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Collect all unique tags from entries
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    entries.forEach(entry => {
      entry.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [entries]);
  
  // Toggle tag selection for filtering
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  // Filter entries based on time period and selected tags
  const filteredEntries = useMemo(() => {
    let filtered = [...entries];
    
    // Apply time filter
    const now = new Date();
    if (timePeriod === 'week') {
      const startDate = subDays(now, 7);
      filtered = filtered.filter(entry => {
        const entryDate = parseISO(entry.created_at);
        return entryDate >= startDate;
      });
    } else if (timePeriod === 'month') {
      const startDate = startOfMonth(now);
      const endDate = endOfMonth(now);
      filtered = filtered.filter(entry => {
        const entryDate = parseISO(entry.created_at);
        return entryDate >= startDate && entryDate <= endDate;
      });
    } else if (timePeriod === 'year') {
      const startDate = new Date(now.getFullYear(), 0, 1);
      filtered = filtered.filter(entry => {
        const entryDate = parseISO(entry.created_at);
        return entryDate >= startDate;
      });
    }
    
    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(entry => 
        entry.tags?.some(tag => selectedTags.includes(tag))
      );
    }
    
    // Sort by date, newest first for timeline, oldest first for chart
    return filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [entries, timePeriod, selectedTags]);
  
  // Prepare data for emotional trends chart
  const chartData = useMemo(() => {
    // Reverse to get chronological order
    const chronologicalEntries = [...filteredEntries].reverse();
    
    if (chronologicalEntries.length === 0) {
      return [];
    }
    
    return chronologicalEntries.map(entry => ({
      x: parseISO(entry.created_at),
      y: moodToValue(entry.mood),
      mood: entry.mood,
      label: `${format(parseISO(entry.created_at), 'MMM d')} - ${getMoodEmoji(entry.mood)}`,
      id: entry.id
    }));
  }, [filteredEntries]);
  
  // Calculate mood averages
  const moodAverages = useMemo(() => {
    if (filteredEntries.length === 0) {
      return { average: 0, trend: 'neutral' };
    }
    
    const moodSum = filteredEntries.reduce((sum, entry) => sum + moodToValue(entry.mood), 0);
    const average = moodSum / filteredEntries.length;
    
    // Determine if trend is improving, declining, or stable
    let trend = 'neutral';
    if (chartData.length >= 3) {
      const firstHalf = chartData.slice(0, Math.floor(chartData.length / 2));
      const secondHalf = chartData.slice(Math.floor(chartData.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, point) => sum + point.y, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, point) => sum + point.y, 0) / secondHalf.length;
      
      if (secondAvg - firstAvg > 0.5) trend = 'improving';
      else if (firstAvg - secondAvg > 0.5) trend = 'declining';
    }
    
    return { average, trend };
  }, [filteredEntries, chartData]);
  
  // Render timeline entry
  const renderTimelineEntry = (entry: JournalEntry, index: number) => {
    const entryDate = parseISO(entry.created_at);
    const formattedDate = format(entryDate, 'MMM d, yyyy');
    const moodColor = getMoodColor(entry.mood, theme);
    
    return (
      <View key={entry.id} style={styles.timelineItem}>
        <View style={styles.timelineDateSection}>
          <Text style={styles.timelineDate}>{formattedDate}</Text>
          <View style={[styles.timelineDot, { backgroundColor: moodColor }]} />
          {index < filteredEntries.length - 1 && (
            <View style={styles.timelineLine} />
          )}
        </View>
        
        <Pressable 
          style={styles.timelineContent}
          onPress={() => router.push(`/journal/${entry.id}`)}
        >
          <Card mode="outlined" style={styles.entryCard}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text variant="titleMedium" numberOfLines={1}>Journal Entry</Text>
                <Text style={styles.moodEmoji}>{getMoodEmoji(entry.mood)}</Text>
              </View>
              
              <Text numberOfLines={2} style={styles.entryPreview}>
                {entry.content.replace(/<[^>]*>/g, '')}
              </Text>
              
              {entry.tags && entry.tags.length > 0 && (
                <View style={styles.tagContainer}>
                  {entry.tags.map(tag => (
                    <Chip key={tag} compact mode="flat" style={styles.tag} textStyle={{ fontSize: 10 }}>
                      {tag}
                    </Chip>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>
        </Pressable>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>Your Progress</Text>
      </View>
      
      {/* Period Filter */}
      <SegmentedButtons
        value={timePeriod}
        onValueChange={(value) => setTimePeriod(value as TimePeriod)}
        buttons={[
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
          { value: 'year', label: 'Year' },
          { value: 'all', label: 'All' }
        ]}
        style={styles.segmentedButtons}
      />
      
      {/* Tag Filters */}
      {allTags.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagFilters}
        >
          {allTags.map(tag => (
            <Chip
              key={tag}
              selected={selectedTags.includes(tag)}
              onPress={() => toggleTag(tag)}
              style={styles.filterChip}
              mode={selectedTags.includes(tag) ? "flat" : "outlined"}
            >
              {tag}
            </Chip>
          ))}
        </ScrollView>
      )}
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Loading your journal data...</Text>
          </View>
        ) : (
          <>
            {/* Mood Summary Card */}
            <Card style={styles.summaryCard}>
              <Card.Content>
                <Text variant="titleMedium">Mood Summary</Text>
                
                <View style={styles.summaryStats}>
                  <View style={styles.statItem}>
                    <Text variant="displaySmall">
                      {getMoodEmoji(valueToMood(moodAverages.average))}
                    </Text>
                    <Text variant="bodyMedium">Average Mood</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text variant="titleLarge">
                      {filteredEntries.length}
                    </Text>
                    <Text variant="bodyMedium">Entries</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text variant="titleLarge" style={{
                      color: moodAverages.trend === 'improving' 
                        ? theme.colors.primary 
                        : moodAverages.trend === 'declining' 
                          ? theme.colors.error 
                          : theme.colors.outline
                    }}>
                      {moodAverages.trend === 'improving' ? '↗️' : 
                       moodAverages.trend === 'declining' ? '↘️' : '→'}
                    </Text>
                    <Text variant="bodyMedium">Trend</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
            
            {/* Mood Trends Placeholder (temporarily removed chart) */}
            <Card style={styles.chartCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.chartTitle}>Mood Trends</Text>
                
                <View style={styles.chartPlaceholder}>
                  <Text style={styles.placeholderText}>Mood visualization coming soon</Text>
                </View>
              </Card.Content>
            </Card>
            
            <Divider style={styles.divider} />
            
            {/* Timeline Title */}
            <Text variant="titleMedium" style={styles.timelineTitle}>Timeline</Text>
            
            {/* Timeline */}
            {filteredEntries.length > 0 ? (
              <View style={styles.timeline}>
                {filteredEntries.map((entry, index) => renderTimelineEntry(entry, index))}
              </View>
            ) : (
              <Card style={styles.emptyCard}>
                <Card.Content>
                  <Text style={styles.emptyTitle}>No journal entries yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Your journal entries will appear here as a timeline
                  </Text>
                </Card.Content>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  segmentedButtons: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  tagFilters: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterChip: {
    marginRight: 8,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  chartCard: {
    marginBottom: 16,
  },
  chartTitle: {
    marginBottom: 12,
  },
  chartContainer: {
    alignItems: 'center',
  },
  timelineTitle: {
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  timeline: {
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineDateSection: {
    width: 80,
    alignItems: 'center',
    position: 'relative',
  },
  timelineDate: {
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
  },
  timelineLine: {
    position: 'absolute',
    top: 30,
    bottom: -16,
    width: 2,
    backgroundColor: '#e0e0e0',
  },
  timelineContent: {
    flex: 1,
  },
  entryCard: {
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodEmoji: {
    fontSize: 18,
  },
  entryPreview: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    marginRight: 4,
    marginBottom: 4,
  },
  divider: {
    marginVertical: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
  emptyCard: {
    marginVertical: 16,
    paddingVertical: 8,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  chartPlaceholder: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginTop: 8,
  },
  placeholderText: {
    fontSize: 16,
    opacity: 0.7,
  },
});
