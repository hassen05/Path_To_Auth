import { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Card, Text, IconButton, Menu, useTheme, Chip, Surface } from 'react-native-paper';
import { formatDistanceToNow } from 'date-fns';
import { JournalEntry, Mood } from '../../types/journal';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface EntryCardProps {
  entry: JournalEntry;
  onDelete: (entry: JournalEntry) => void;
  onEdit: (entry: JournalEntry) => void;
}

const MOOD_ICONS: Record<Mood, keyof typeof MaterialCommunityIcons.glyphMap> = {
  happy: 'emoticon-happy-outline',
  excited: 'emoticon-excited-outline',
  neutral: 'emoticon-neutral-outline',
  sad: 'emoticon-sad-outline',
  anxious: 'emoticon-sad-outline',
  calm: 'emoticon-cool-outline',
};

export function EntryCard({ entry, onDelete, onEdit }: EntryCardProps) {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  const formattedTime = formatDistanceToNow(new Date(entry.created_at), {
    addSuffix: true,
  });

  return (
    <Card
      style={styles.card}
      mode="elevated"
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons
            name={MOOD_ICONS[entry.mood]}
            size={24}
            color={theme.colors.primary}
          />
          <Text variant="labelMedium" style={styles.time}>
            {formattedTime}
          </Text>
        </View>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              size={20}
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              onEdit(entry);
            }}
            title="Edit"
            leadingIcon="pencil"
          />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              onDelete(entry);
            }}
            title="Delete"
            leadingIcon="delete"
          />
        </Menu>
      </View>
      <Card.Content>
        {entry.title && (
          <Text variant="titleMedium" style={styles.title}>
            {entry.title}
          </Text>
        )}
        <Text variant="bodyMedium" numberOfLines={3} ellipsizeMode="tail">
          {entry.content?.replace(/<[^>]*>?/gm, '') || ''}
        </Text>
        
        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsContainer}>
            {entry.tags.map((tag, index) => (
              <Chip 
                key={index} 
                style={styles.tag}
                textStyle={styles.tagText}
                compact
              >
                {tag}
              </Chip>
            ))}
          </ScrollView>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    marginLeft: 8,
    opacity: 0.7,
  },
  title: {
    marginBottom: 8,
    fontWeight: '600',
    color: '#764094',
  },
  tagsContainer: {
    flexDirection: 'row',
    marginTop: 12,
    maxHeight: 30,
  },
  tag: {
    marginRight: 8,
    backgroundColor: 'rgba(118, 64, 148, 0.1)',
    borderColor: 'rgba(118, 64, 148, 0.3)',
    height: 24,
  },
  tagText: {
    fontSize: 12,
    color: '#764094',
  },
});
