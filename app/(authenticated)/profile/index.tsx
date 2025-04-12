import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Button, Avatar, List, useTheme, Divider, Surface, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/auth';
import { useJournal } from '../../../hooks/useJournal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';

const MOOD_EMOJIS = {
  great: '🤩',
  good: '😊',
  neutral: '😐',
  bad: '😔',
  terrible: '😢',
};

export default function Profile() {
  const theme = useTheme();
  const router = useRouter();
  const { session, signOut } = useAuth();
  const { entries } = useJournal();

  // Calculate statistics
  const stats = useMemo(() => ({
    totalEntries: entries.length,
    streakDays: calculateStreak(entries),
    moodDistribution: calculateMoodDistribution(entries),
  }), [entries]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  const initials = session?.user?.email 
    ? session.user.email.substring(0, 2).toUpperCase() 
    : '??';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['left', 'right']}>
      <StatusBar style="dark" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="headlineLarge" style={[styles.title, { color: theme.colors.primary }]}>Profile</Text>
        </View>

        <Surface style={[styles.profileCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.profileContent}>
            <Avatar.Text
              size={80}
              label={initials}
              style={{ backgroundColor: theme.colors.primary }}
              color="#fff"
            />
            <View style={styles.profileInfo}>
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>{session?.user?.email}</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>Member since {new Date().getFullYear()}</Text>
            </View>
          </View>
        </Surface>
        
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Journal Stats
        </Text>

        <View style={styles.statsContainer}>
          <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <MaterialCommunityIcons name="notebook-outline" size={24} color={theme.colors.primary} />
            <Text variant="headlineSmall" style={styles.statValue}>{stats.totalEntries}</Text>
            <Text variant="bodyMedium" style={styles.statLabel}>Total Entries</Text>
          </Surface>
          
          <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <MaterialCommunityIcons name="fire" size={24} color={theme.colors.primary} />
            <Text variant="headlineSmall" style={styles.statValue}>{stats.streakDays}</Text>
            <Text variant="bodyMedium" style={styles.statLabel}>Day Streak</Text>
          </Surface>
          
          <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="headlineSmall" style={styles.statValue}>
              {calculateTopMood(stats.moodDistribution)}
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>Top Mood</Text>
          </Surface>
        </View>

        <View style={styles.moodChartContainer}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Mood Breakdown
          </Text>
          <Surface style={[styles.moodChart, { backgroundColor: theme.colors.surface }]} elevation={1}>
            {Object.entries(MOOD_EMOJIS).map(([mood, emoji]) => (
              <View key={mood} style={styles.moodItem}>
                <Text style={styles.moodEmoji}>{emoji}</Text>
                <View style={[styles.moodBar, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <View 
                    style={[
                      styles.moodFill, 
                      { 
                        backgroundColor: theme.colors.primary, 
                        width: `${calculateMoodPercentage(stats.moodDistribution, mood)}%`
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.moodCount}>
                  {stats.moodDistribution[mood] || 0}
                </Text>
              </View>
            ))}
          </Surface>
        </View>

        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Settings
        </Text>

        <Surface style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <List.Section style={styles.listSection}>
            <List.Item
              title="Notification Settings"
              left={props => <List.Icon {...props} icon="bell-outline" color={theme.colors.primary} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {/* TODO: Add notification settings */}}
            />
            <Divider />
            <List.Item
              title="Privacy Policy"
              left={props => <List.Icon {...props} icon="shield-outline" color={theme.colors.primary} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {/* TODO: Add privacy policy */}}
            />
            <Divider />
            <List.Item
              title="Terms of Service"
              left={props => <List.Icon {...props} icon="file-document-outline" color={theme.colors.primary} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {/* TODO: Add terms of service */}}
            />
          </List.Section>
        </Surface>

        <Button
          mode="outlined"
          onPress={handleSignOut}
          style={[styles.signOutButton, { borderColor: theme.colors.error }]}
          textColor={theme.colors.error}
          icon="logout"
        >
          Sign Out
        </Button>

        <Text variant="bodySmall" style={[styles.version, { color: theme.colors.outline }]}>
          Version 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function calculateStreak(entries: any[]): number {
  if (entries.length === 0) return 0;

  let streak = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Sort entries by date, newest first
  const sortedDates = entries
    .map(entry => new Date(entry.created_at))
    .sort((a, b) => b.getTime() - a.getTime());

  // Check if there's an entry for today
  const mostRecent = new Date(sortedDates[0]);
  mostRecent.setHours(0, 0, 0, 0);
  
  if (mostRecent.getTime() !== today.getTime()) return 0;

  // Count consecutive days
  for (let i = 1; i < sortedDates.length; i++) {
    const current = new Date(sortedDates[i]);
    const prev = new Date(sortedDates[i - 1]);
    
    current.setHours(0, 0, 0, 0);
    prev.setHours(0, 0, 0, 0);

    const diffDays = (prev.getTime() - current.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function calculateMoodDistribution(entries: any[]): Record<string, number> {
  return entries.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function calculateTopMood(distribution: Record<string, number>): string {
  if (Object.keys(distribution).length === 0) return '😊';
  
  const sortedMoods = Object.entries(distribution)
    .sort(([, a], [, b]) => b - a);
    
  if (sortedMoods.length === 0) return '😊';
  
  const topMood = sortedMoods[0][0];
  return MOOD_EMOJIS[topMood as keyof typeof MOOD_EMOJIS] || '😊';
}

function calculateMoodPercentage(distribution: Record<string, number>, mood: string): number {
  const count = distribution[mood] || 0;
  const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
  
  if (total === 0) return 0;
  return Math.floor((count / total) * 100);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontWeight: 'bold',
  },
  profileCard: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 20,
    flex: 1,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    margin: 8,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    marginTop: 4,
    opacity: 0.7,
  },
  moodChartContainer: {
    marginBottom: 24,
  },
  moodChart: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
  },
  moodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  moodEmoji: {
    fontSize: 20,
    width: 30,
  },
  moodBar: {
    height: 12,
    flex: 1,
    borderRadius: 6,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  moodFill: {
    height: '100%',
    borderRadius: 6,
  },
  moodCount: {
    width: 30,
    textAlign: 'right',
    fontSize: 12,
  },
  settingsCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  listSection: {
    width: '100%',
  },
  signOutButton: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  version: {
    textAlign: 'center',
  },
});
