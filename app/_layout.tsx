import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../contexts/auth';
import { theme } from './theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { useSegments, useRouter } from 'expo-router';
import { initDatabase } from '../lib/initDatabase';
import { Text, View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';

function RootLayout() {
  const { session } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isDatabaseInitialized, setIsDatabaseInitialized] = useState(false);
  const [fontsLoaded] = useFonts({
    // Make sure all custom fonts load correctly
    'GreatVibes-Regular': require('../assets/fonts/GreatVibes-Regular.ttf'),
    'SummaryNotes-Regular': require('../assets/fonts/SummaryNotesRegular-Ea5ln.ttf'),
  });

  // Initialize database tables when the app starts
  useEffect(() => {
    async function setupDatabase() {
      try {
        await initDatabase();
        setIsDatabaseInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        // Still set as initialized to not block the app
        setIsDatabaseInitialized(true);
      }
    }
    
    setupDatabase();
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    const inAuthenticatedGroup = segments[0] === '(authenticated)';

    if (session && inAuthGroup) {
      // Redirect authenticated users to the main app
      router.replace('/(authenticated)/journal');
    } else if (!session && !inAuthGroup) {
      // Redirect unauthenticated users to the login page
      router.replace('/(auth)/');
    }
  }, [session, segments]);

  // Instead of returning a loading screen, we'll show a loading overlay
  // while keeping the navigation structure intact

  return (
    <>
      {!fontsLoaded && (
        <View style={{ 
          position: 'absolute', 
          width: '100%', 
          height: '100%', 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.8)',
          zIndex: 999 
        }}>
          <ActivityIndicator size="large" color="#764094" />
        </View>
      )}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(authenticated)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <SafeAreaProvider>
          <PaperProvider theme={theme}>
            <RootLayout />
          </PaperProvider>
        </SafeAreaProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
