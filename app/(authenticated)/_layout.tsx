import { View, StyleSheet } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '../../contexts/auth';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AuthenticatedLayout() {
  const { session, initialized } = useAuth();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Show loading indicator while checking auth state
  if (!initialized) {
    return <View style={styles.container} />;
  }

  // If user is not authenticated, redirect to sign in
  if (!session) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.elevation.level2,
          borderTopWidth: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="journal/index"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="notebook" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reflections/index"
        options={{
          title: 'Reflect',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="lightbulb-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights/index"
        options={{
          headerShown: false,
          title: 'AI Chat',
          tabBarIcon: ({ focused, color }) => <MaterialCommunityIcons name="chat-processing" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookmarks/index"
        options={{
          headerShown: false,
          title: 'Bookmarks',
          tabBarIcon: ({ focused, color }) => <MaterialCommunityIcons name="bookmark" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress/index"
        options={{
          headerShown: false,
          title: 'Progress',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="chart-line" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
