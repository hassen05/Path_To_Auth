import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, FlatList, Pressable, ImageStyle, TextStyle, ViewStyle } from 'react-native';
import { 
  useTheme, 
  Text, 
  Button, 
  Card, 
  FAB, 
  Snackbar, 
  ActivityIndicator, 
  MD3Theme, 
  Surface, 
  IconButton, 
  TextInput, 
  Menu
} from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { formatDistanceToNow } from 'date-fns';
import { useJournal } from '../../../hooks/useJournal';
import { useJournalChat } from '../../../hooks/useJournalChat';
import { useSavedInsights } from '../../../hooks/useSavedInsights';
import { JournalEntry, Mood, AIInsight, ChatMessage, SavedInsight } from '../../../types/journal';

// Types and interfaces
interface StylesType {
  container: ViewStyle;
  emptyContainer: ViewStyle;
  emptyTitle: TextStyle;
  emptyText: TextStyle;
  header: ViewStyle;
  title: TextStyle;
  searchBar: ViewStyle;
  segmentedButtons: ViewStyle;
  card: ViewStyle;
  cardTitle: TextStyle;
  cardContent: TextStyle;
  timestamp: TextStyle;
  fab: ViewStyle;
  loader: ViewStyle;
  insightCard: ViewStyle;
  insightContent: TextStyle;
  patternContainer: ViewStyle;
  sectionTitle: TextStyle;
  patternText: TextStyle;
  stepsContainer: ViewStyle;
  stepItem: ViewStyle;
  stepNumber: TextStyle;
  stepText: TextStyle;
  affirmationContainer: ViewStyle;
  affirmationText: TextStyle;
  listContent: ViewStyle;
  snackbar: ViewStyle;
  insightDate: TextStyle;
  entrySelectorContainer: ViewStyle;
  entrySelectorHeader: ViewStyle;
  entrySelectorTitle: TextStyle;
  entrySelectorList: ViewStyle;
  entryItem: ViewStyle;
  entryItemHeader: ViewStyle;
  entryMoodEmoji: TextStyle;
  entryDate: TextStyle;
  entryContent: TextStyle;
  messageContainer: ViewStyle;
  aiMessage: ViewStyle;
  userMessage: ViewStyle;
  messageContent: ViewStyle;
  messageText: TextStyle;
  messageTimestamp: TextStyle;
  chatContainer: ViewStyle;
  messagesList: ViewStyle;
  inputContainer: ViewStyle;
  input: ViewStyle;
  sendButton: ViewStyle;
}

// Get mood emoji
const getMoodEmoji = (mood: Mood): string => {
  const emojis: Record<Mood, string> = {
    happy: '😊',
    sad: '😔',
    neutral: '😐',
    excited: '🤩',
    anxious: '😰',
    calm: '😌',
  };
  return emojis[mood] || '😐';
};

// Custom hooks for styles
function useStyles(): StylesType {
  const theme = useTheme<MD3Theme>();
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    header: {
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    searchBar: {
      marginTop: 8,
    },
    segmentedButtons: {
      marginTop: 8,
    },
    card: {
      margin: 8,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    cardContent: {
      color: theme.colors.onSurface,
    },
    timestamp: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 8,
    },
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
    },
    loader: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    insightCard: {
      marginVertical: 8,
    },
    insightContent: {
      color: theme.colors.onSurface,
    },
    patternContainer: {
      marginTop: 16,
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      marginBottom: 8,
    },
    patternText: {
      color: theme.colors.onSurface,
    },
    stepsContainer: {
      marginTop: 16,
    },
    stepItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: 8,
    },
    stepNumber: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginRight: 8,
    },
    stepText: {
      color: theme.colors.onSurface,
    },
    affirmationContainer: {
      marginTop: 16,
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
    },
    affirmationText: {
      color: theme.colors.onSurface,
      fontStyle: 'italic',
    },
    listContent: {
      padding: 16,
    },
    snackbar: {
      backgroundColor: theme.colors.surface,
    },
    insightDate: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 8,
    },
    entrySelectorContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.background,
      padding: 16,
    },
    entrySelectorHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    entrySelectorTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    entrySelectorList: {
      padding: 16,
    },
    entryItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    entryItemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    entryMoodEmoji: {
      fontSize: 24,
    },
    entryDate: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    entryContent: {
      fontSize: 14,
    },
    messageContainer: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    aiMessage: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 16,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
    },
    userMessage: {
      backgroundColor: theme.colors.primary,
      borderTopRightRadius: 16,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
    },
    messageContent: {
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    messageText: {
      fontSize: 14,
      color: theme.colors.onSurface,
    },
    messageTimestamp: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 8,
    },
    chatContainer: {
      flex: 1,
      padding: 16,
    },
    messagesList: {
      padding: 16,
    },
    inputContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
    },
    input: {
      flex: 1,
      marginRight: 16,
    },
    sendButton: {
      width: 80,
    },
  });
}

// Main InsightsScreen component
export default function InsightsScreen() {
  // State management
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [messageText, setMessageText] = useState('');
  const [showEntrySelector, setShowEntrySelector] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const chatListRef = useRef<FlatList>(null);

  const { entries } = useJournal();
  const { 
    messages, 
    sendMessage, 
    isLoading, 
    selectedEntry, 
    selectEntry,
    clearChat,
    isAllEntriesMode,
    conversationId,
    isBookmarked,
    bookmarkConversation
  } = useJournalChat();
  const { savedInsights } = useSavedInsights();
  const styles = useStyles();

  const scrollToBottom = useCallback(() => {
    if (chatListRef.current && messages.length > 0) {
      chatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages.length, scrollToBottom]);

  const handleEntrySelect = useCallback(async (entry: JournalEntry) => {
    try {
      if (!entry || !entry.id) {
        console.error('Invalid entry:', entry);
        setSnackbarMessage('Invalid entry selected. Please try again.');
        setSnackbarVisible(true);
        return;
      }

      // Log the entry being selected for debugging
      console.log('Selecting entry:', {
        id: entry.id,
        created_at: entry.created_at,
        mood: entry.mood,
        content: entry.content.substring(0, 20) + '...' // Log only first 20 chars
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await selectEntry(entry);
      
      // Give the user feedback that the entry was selected
      setSnackbarMessage(`Selected entry: ${new Date(entry.created_at).toLocaleDateString()}`);
      setSnackbarVisible(true);
      
      setShowEntrySelector(false);
    } catch (error) {
      console.error('Error selecting entry:', error);
      setSnackbarMessage(error instanceof Error ? error.message : 'Failed to select entry. Please try again.');
      setSnackbarVisible(true);
      setShowEntrySelector(false);
    }
  }, [selectEntry]);

  const handleSendMessage = useCallback(() => {
    if (!messageText.trim()) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      sendMessage(messageText);
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      setSnackbarMessage(error instanceof Error ? error.message : 'Failed to send message. Please try again.');
      setSnackbarVisible(true);
    }
  }, [messageText, sendMessage]);

  const handleToggleBookmark = useCallback(async () => {
    if (conversationId) {
      await bookmarkConversation(conversationId, !isBookmarked);
      setSnackbarMessage(isBookmarked ? 'Conversation unbookmarked' : 'Conversation bookmarked');
      setSnackbarVisible(true);
    }
  }, [conversationId, isBookmarked, bookmarkConversation]);

  const isMessageBookmarked = (message: ChatMessage): boolean => {
    return savedInsights.some(insight => insight.id === message.id);
  };

  const renderEntrySelector = () => {
    if (!showEntrySelector) return null;
    
    if (!entries?.length) {
      return (
        <Surface style={styles.entrySelectorContainer}>
          <View style={styles.entrySelectorHeader}>
            <Text style={styles.entrySelectorTitle}>No entries found</Text>
            <IconButton 
              icon="close" 
              size={20} 
              onPress={() => setShowEntrySelector(false)}
            />
          </View>
          <Text style={styles.entryContent}>
            Please create a journal entry first to discuss it.
          </Text>
        </Surface>
      );
    }

    const theme = useTheme<MD3Theme>();

    return (
      <Surface style={styles.entrySelectorContainer}>
        <View style={styles.entrySelectorHeader}>
          <Text style={styles.entrySelectorTitle}>
            {isAllEntriesMode 
              ? 'Select an entry to focus on' 
              : 'Select a different entry'}
          </Text>
          <IconButton 
            icon="close" 
            size={20} 
            onPress={() => setShowEntrySelector(false)}
          />
        </View>
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.entrySelectorList}
          renderItem={({ item }) => (
            <Pressable 
              style={styles.entryItem} 
              onPress={() => handleEntrySelect(item)}
              android_ripple={{ color: theme.colors.onSurfaceVariant }}
            >
              <View style={styles.entryItemHeader}>
                <Text style={styles.entryMoodEmoji}>{getMoodEmoji(item.mood)}</Text>
                <Text style={styles.entryDate}>
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </Text>
              </View>
              <Text style={styles.entryContent}>{item.content}</Text>
            </Pressable>
          )}
        />
      </Surface>
    );
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isAI = item.sender === 'ai';
    const isBookmarked = isMessageBookmarked(item);
    
    return (
      <View style={[styles.messageContainer, isAI ? styles.aiMessage : styles.userMessage]}>
        <View style={styles.messageContent}>
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.messageTimestamp}>
            {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
          </Text>
          {isBookmarked && (
            <IconButton
              icon="bookmark"
              size={20}
              onPress={() => handleToggleBookmark()}
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text style={styles.title}>AI Chat</Text>
        {(conversationId && selectedEntry?.id) && (
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={<IconButton icon={isBookmarked ? "bookmark" : "bookmark-outline"} onPress={() => setMenuVisible(true)} />}
          >
            <Menu.Item
              leadingIcon={isBookmarked ? "bookmark-remove" : "bookmark-plus"}
              onPress={handleToggleBookmark}
              title={isBookmarked ? "Unbookmark Conversation" : "Bookmark Conversation"}
            />
            <Menu.Item
              leadingIcon="delete"
              onPress={() => {
                clearChat();
                setSnackbarMessage('Chat cleared');
                setSnackbarVisible(true);
              }}
              title="Clear Chat"
            />
          </Menu>
        )}
      </View>

      {showEntrySelector && renderEntrySelector()}

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
      >
        <FlatList
          ref={chatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
        />

        <View style={styles.inputContainer}>
          <TextInput
            mode="outlined"
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type your message..."
            onSubmitEditing={handleSendMessage}
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
            style={styles.sendButton}
          >
            Send
          </Button>
        </View>
      </KeyboardAvoidingView>

      <FAB
        icon={isAllEntriesMode ? "notebook" : "notebook-edit"}
        onPress={() => {
          if (isAllEntriesMode) {
            setShowEntrySelector(true);
          } else {
            selectEntry(null);
          }
        }}
        style={styles.fab}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}
