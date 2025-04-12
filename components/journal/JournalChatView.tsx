import React, { useState, useCallback, useRef, memo, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Card, TextInput, Avatar, useTheme, IconButton, Button, ActivityIndicator, Chip, Badge, MD3Theme, Divider } from 'react-native-paper';
import { JournalEntry } from '../../types/journal';
import { useJournalChat, ChatMessage } from '../../hooks/useJournalChat';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';

interface JournalChatViewProps {
  entries: JournalEntry[];
  onShowSnackbar: (message: string) => void;
}

type ChatMode = 'select' | 'single' | 'all';

const JournalChatView: React.FC<JournalChatViewProps> = ({ entries, onShowSnackbar }) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { 
    messages, 
    sendMessage, 
    isLoading, 
    selectedEntry, 
    selectEntry, 
    selectAllEntries, 
    isAllEntriesMode,
    clearChat,
    conversationId,
    bookmarkConversation,
    isBookmarked
  } = useJournalChat();
  
  const [userInput, setUserInput] = useState('');
  const [chatMode, setChatMode] = useState<ChatMode>('select');
  const chatListRef = useRef<FlatList>(null);
  
  // Define constants for optimization
  const MESSAGE_ITEM_HEIGHT = 80; // Average height of a message item
  
  // Handler for sending a message
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    if (chatMode === 'select') {
      onShowSnackbar('Please select a chat option first');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await sendMessage(userInput);
    setUserInput('');
    
    // Scroll to the bottom of chat
    setTimeout(() => {
      chatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };
  
  // Handler for selecting an entry
  const handleSelectEntry = useCallback((entry: JournalEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectEntry(entry);
    setChatMode('single');
  }, [selectEntry]);
  
  // Handler for selecting all entries mode
  const handleSelectAllEntries = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectAllEntries();
    setChatMode('all');
  }, [selectAllEntries]);
  
  // Memoized Chat Message Component
  const MessageItem = memo(({ message, theme, styles }: { 
    message: ChatMessage;
    theme: MD3Theme;
    styles: ReturnType<typeof createStyles>;
  }) => {
    const isAI = message.sender === 'ai';
    const formattedTime = useMemo(() => {
      return format(new Date(message.timestamp), 'h:mm a');
    }, [message.timestamp]);
    
    return (
      <View style={[styles.messageContainer, isAI ? styles.aiMessageContainer : styles.userMessageContainer]}>
        <View style={styles.avatarContainer}>
          {isAI ? (
            <Avatar.Icon size={36} icon="robot" style={styles.aiAvatar} color={theme.colors.onPrimary} />
          ) : (
            <Avatar.Icon size={36} icon="account" style={styles.userAvatar} />
          )}
        </View>
        <View style={[styles.messageBubble, isAI ? styles.aiMessageBubble : styles.userMessageBubble]}>
          <Text style={styles.messageText}>{message.text}</Text>
          <Text style={styles.messageTime}>{formattedTime}</Text>
        </View>
      </View>
    );
  });
  
  // Chat message renderer function (minimal to improve performance)
  const renderChatMessage = useCallback(({ item }: { item: ChatMessage }) => {
    return <MessageItem message={item} theme={theme} styles={styles} />;
  }, [theme, styles]);
  
  // Memoized Entry Item Component
  const EntryItem = memo(({ 
    entry, 
    isSelected, 
    onSelect, 
    styles 
  }: { 
    entry: JournalEntry;
    isSelected: boolean;
    onSelect: (entry: JournalEntry) => void;
    styles: ReturnType<typeof createStyles>;
  }) => {
    // Pre-calculate formatted values to avoid recalculation on re-renders
    const formattedDate = useMemo(() => {
      return format(new Date(entry.created_at), 'MMM d, yyyy');
    }, [entry.created_at]);
    
    const truncatedContent = useMemo(() => {
      return entry.content.length > 100
        ? `${entry.content.substring(0, 100)}...`
        : entry.content;
    }, [entry.content]);
    
    const handlePress = useCallback(() => {
      onSelect(entry);
    }, [entry, onSelect]);
    
    return (
      <TouchableOpacity onPress={handlePress}>
        <Card 
          style={[styles.entryCard, isSelected && styles.selectedEntryCard]} 
          mode="outlined"
        >
          <Card.Content>
            <View style={styles.entryCardHeader}>
              <Text style={styles.entryDateText}>{formattedDate}</Text>
              <Chip icon="emoticon" compact>{entry.mood}</Chip>
            </View>
            <Text style={styles.entryPreviewText}>{truncatedContent}</Text>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  });
  
  // Entry item renderer function
  const renderEntryItem = useCallback(({ item }: { item: JournalEntry }) => {
    const isSelected = selectedEntry?.id === item.id;
    return <EntryItem 
      entry={item} 
      isSelected={isSelected} 
      onSelect={handleSelectEntry} 
      styles={styles} 
    />;
  }, [selectedEntry, handleSelectEntry, styles]);

  // Selection mode view
  const renderSelectionView = () => (
    <View style={styles.selectionContainer}>
      <Text style={styles.selectionTitle}>Chat with AI about your journal</Text>
      
      <Card style={styles.optionCard} onPress={handleSelectAllEntries}>
        <Card.Content style={styles.optionCardContent}>
          <Avatar.Icon size={40} icon="book-open-variant" style={styles.optionIcon} />
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Discuss All Entries</Text>
            <Text style={styles.optionDescription}>
              Chat about patterns and insights across your entire journal
            </Text>
          </View>
        </Card.Content>
      </Card>
      
      <Divider style={styles.divider} />
      
      <Text style={styles.sectionTitle}>Or select a specific entry:</Text>
      
      <FlatList
        data={entries}
        renderItem={renderEntryItem}
        keyExtractor={entryKeyExtractor}
        style={styles.entriesList}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        windowSize={5}
        initialNumToRender={10}
        updateCellsBatchingPeriod={50}
      />
    </View>
  );
  
  // Handle bookmarking a conversation
  const handleBookmark = useCallback(async () => {
    if (!conversationId) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await bookmarkConversation(conversationId, !isBookmarked);
      onShowSnackbar(isBookmarked ? 'Chat removed from bookmarks' : 'Chat bookmarked');
    } catch (error) {
      console.error('Error bookmarking chat:', error);
      onShowSnackbar('Failed to bookmark chat');
    }
  }, [conversationId, bookmarkConversation, isBookmarked, onShowSnackbar]);

  // Chat view header
  const renderChatHeader = useCallback(() => {
    if (chatMode === 'select') return null;
    
    return (
      <View style={styles.chatHeader}>
        <IconButton 
          icon="arrow-left" 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            clearChat();
            setChatMode('select');
          }}
        />
        <View style={styles.chatHeaderContent}>
          {chatMode === 'single' && selectedEntry ? (
            <>
              <Text style={styles.chatHeaderTitle}>
                {format(new Date(selectedEntry.created_at), 'MMMM d, yyyy')}
              </Text>
              <Badge style={styles.moodBadge}>{selectedEntry.mood}</Badge>
            </>
          ) : (
            <>
              <Text style={styles.chatHeaderTitle}>All Journal Entries</Text>
              <Text style={styles.chatHeaderSubtitle}>Analyzing patterns across your journal</Text>
            </>
          )}
        </View>
        <IconButton 
          icon={isBookmarked ? "bookmark" : "bookmark-outline"} 
          onPress={handleBookmark}
        />
      </View>
    );
  }, [chatMode, selectedEntry, clearChat, isBookmarked, handleBookmark]);
  // Calculate estimated height for getItemLayout optimization
  const getItemLayout = useCallback((data: any, index: number) => ({
    length: MESSAGE_ITEM_HEIGHT,
    offset: MESSAGE_ITEM_HEIGHT * index,
    index,
  }), []);
  
  // Optimize entry list
  const entryKeyExtractor = useCallback((item: JournalEntry) => item.id, []);
  
  // Message key extractor for FlatList
  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Show chat selection view or chat view based on mode */}
      {chatMode === 'select' ? (
        renderSelectionView()
      ) : (
        <View style={styles.chatContainer}>
          {renderChatHeader()}
          
          <FlatList
            ref={chatListRef}
            data={messages}
            renderItem={renderChatMessage}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.chatList}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            updateCellsBatchingPeriod={50}
            initialNumToRender={15}
            getItemLayout={getItemLayout}
            ListEmptyComponent={
              <View style={styles.emptyChatContainer}>
                <Text style={styles.emptyChatText}>
                  Send a message to start chatting about your journal.
                </Text>
              </View>
            }
          />
          
          <View style={styles.inputContainer}>
            <TextInput
              value={userInput}
              onChangeText={setUserInput}
              placeholder="Type your message..."
              right={<TextInput.Icon icon="send" onPress={handleSendMessage} />}
              style={styles.textInput}
              multiline
              dense
              disabled={isLoading}
              onSubmitEditing={handleSendMessage}
              blurOnSubmit={false}
            />
          </View>
        </View>
      )}
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  chatContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  selectionContainer: {
    flex: 1,
    padding: 16,
  },
  selectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.onBackground,
  },
  optionCard: {
    marginBottom: 24,
  },
  optionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    backgroundColor: theme.colors.primary,
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  optionDescription: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    color: theme.colors.onBackground,
  },
  entriesList: {
    paddingBottom: 40,
  },
  entryCard: {
    marginBottom: 12,
  },
  selectedEntryCard: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  entryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryDateText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  entryPreviewText: {
    color: theme.colors.onSurface,
    fontSize: 14,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  chatHeaderContent: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
  },
  chatHeaderSubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  moodBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  chatList: {
    padding: 16,
    paddingBottom: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  avatarContainer: {
    marginRight: 8,
  },
  aiMessageContainer: {
    alignSelf: 'flex-start',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
  },
  aiMessageBubble: {
    backgroundColor: theme.colors.surfaceVariant,
    borderBottomLeftRadius: 4,
  },
  userMessageBubble: {
    backgroundColor: theme.colors.primaryContainer,
    borderBottomRightRadius: 4,
  },
  aiAvatar: {
    backgroundColor: theme.colors.primary,
  },
  userAvatar: {
    backgroundColor: theme.colors.secondary,
    marginLeft: 8,
  },
  messageText: {
    fontSize: 16,
    color: theme.colors.onSurface,
  },
  messageTime: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
  },
  textInput: {
    maxHeight: 100,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChatContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChatText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});

export default JournalChatView;
