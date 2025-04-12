import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Pressable, ScrollView } from 'react-native';
import { Text, Card, IconButton, useTheme, Surface, Divider, Button, Searchbar, Chip, Menu, Dialog, Portal, Snackbar, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { formatDistanceToNow } from 'date-fns';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSavedInsights } from '../../../hooks/useSavedInsights';
import { SavedInsight } from '../../../types/insight';

export default function BookmarksScreen() {
  const theme = useTheme();
  const { savedInsights, deleteInsight, updateInsight, loading } = useSavedInsights();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuInsightId, setMenuInsightId] = useState<string | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogInsightId, setDialogInsightId] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Extract all unique tags from insights
  const allTags = [...new Set(savedInsights.flatMap(insight => insight.tags || []))];

  // Filter insights based on search query and selected tags
  const filteredInsights = savedInsights.filter(insight => {
    const matchesSearch = !searchQuery || 
      insight.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => insight.tags?.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  // Show snackbar with message
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  // Handle opening context menu for an insight
  const handleOpenMenu = (id: string) => {
    setMenuInsightId(id);
    setMenuVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Handle deleting an insight
  const handleDeleteInsight = async () => {
    if (!dialogInsightId) return;
    
    try {
      await deleteInsight(dialogInsightId);
      showSnackbar('Insight removed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error deleting insight:', error);
      showSnackbar('Failed to delete insight');
    } finally {
      setDialogVisible(false);
      setDialogInsightId(null);
    }
  };

  // Confirm deletion dialog
  const confirmDelete = (id: string) => {
    setDialogInsightId(id);
    setDialogVisible(true);
    setMenuVisible(false);
  };

  // Toggle a tag filter
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  // Navigate to entry if available
  const navigateToEntry = (entryId?: string) => {
    if (!entryId) {
      showSnackbar('No journal entry linked to this insight');
      return;
    }
    
    router.push(`/journal/${entryId}`);
  };

  // Render each insight item
  const renderInsight = ({ item }: { item: SavedInsight }) => {
    const formattedDate = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });
    
    return (
      <Card style={styles.insightCard} mode="outlined">
        <Card.Content>
          <Text style={styles.insightText}>{item.message}</Text>
          
          {item.entryDate && (
            <Pressable 
              onPress={() => navigateToEntry(item.entryId)}
              style={styles.entryReference}
            >
              <Text style={styles.entryDate}>From journal entry: {item.entryDate}</Text>
            </Pressable>
          )}
          
          <View style={styles.tagContainer}>
            {item.tags?.map(tag => (
              <Chip 
                key={tag} 
                mode="outlined" 
                style={styles.tag} 
                textStyle={styles.tagText}
                onPress={() => toggleTag(tag)}
              >
                {tag}
              </Chip>
            ))}
          </View>
          
          <View style={styles.insightFooter}>
            <Text style={styles.timestamp}>{formattedDate}</Text>
            
            <IconButton
              icon="dots-vertical"
              size={20}
              onPress={() => handleOpenMenu(item.id)}
              style={styles.menuButton}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>Bookmarked Insights</Text>
      </View>
      
      <Searchbar
        placeholder="Search saved insights"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      
      {allTags.length > 0 && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by tag:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
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
        </View>
      )}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading bookmarks...</Text>
        </View>
      ) : filteredInsights.length > 0 ? (
        <FlatList
          data={filteredInsights}
          renderItem={renderInsight}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : savedInsights.length > 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No insights match your filters</Text>
          {selectedTags.length > 0 && (
            <Button 
              mode="outlined" 
              onPress={() => setSelectedTags([])}
              style={styles.clearButton}
            >
              Clear Filters
            </Button>
          )}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No bookmarked insights yet</Text>
          <Text style={styles.emptySubtext}>
            When chatting with your journal AI, tap the bookmark icon on insights you want to save
          </Text>
          <Button 
            mode="contained" 
            onPress={() => router.push('/insights')}
            style={styles.chatButton}
            icon="chat-processing"
          >
            Chat with Journal AI
          </Button>
        </View>
      )}
      
      {/* Context Menu */}
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={{ x: 0, y: 0 }}
        style={styles.menu}
      >
        <Menu.Item 
          onPress={() => {
            setMenuVisible(false);
            if (menuInsightId) confirmDelete(menuInsightId);
          }} 
          title="Delete" 
          leadingIcon="delete"
        />
      </Menu>
      
      {/* Confirmation Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Delete Bookmark</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this bookmarked insight?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleDeleteInsight}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Feedback Snackbar */}
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
  searchbar: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  filterLabel: {
    marginBottom: 8,
    fontWeight: '500',
  },
  tagsScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  listContent: {
    padding: 16,
  },
  insightCard: {
    marginBottom: 8,
  },
  insightText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  entryReference: {
    marginVertical: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  entryDate: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
  },
  insightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  timestamp: {
    fontSize: 12,
    color: 'gray',
  },
  menuButton: {
    margin: 0,
  },
  separator: {
    height: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    textAlign: 'center',
    marginBottom: 16,
    color: 'gray',
  },
  clearButton: {
    marginTop: 16,
  },
  chatButton: {
    marginTop: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: 'gray',
  },
  menu: {
    position: 'absolute',
    right: 24,
    top: 300,
  },
  snackbar: {
    bottom: 16,
  },
});
