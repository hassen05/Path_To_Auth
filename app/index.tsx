import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/auth';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, useTheme } from 'react-native-paper';

export default function Index() {
  const { session, initialized } = useAuth();
  const theme = useTheme();

  if (!initialized) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return session ? <Redirect href="/(authenticated)/journal" /> : <Redirect href="/(auth)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
