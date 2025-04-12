import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, useTheme, Avatar } from 'react-native-paper';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '../../contexts/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ImageBackground, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { signUp } = useAuth();
  const theme = useTheme();
  const router = useRouter();

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setError(null);
      await signUp(email, password);
      router.replace('/(authenticated)/journal');
    } catch (err) {
      setError('Failed to create account');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <ImageBackground
        source={{ uri: 'https://images.pexels.com/photos/3243090/pexels-photo-3243090.jpeg' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.75)', 'rgba(0,0,0,0.5)']}
          style={styles.gradient}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
          >
            <View style={styles.logoContainer}>
              <Avatar.Icon 
                size={80} 
                icon="book-open-page-variant" 
                color="#fff"
                style={{ backgroundColor: theme.colors.primary }}
              />
              <Text variant="displaySmall" style={styles.title}>Path to Authenticity</Text>
              <Text variant="bodyLarge" style={styles.subtitle}>Your Reflective Journal</Text>
            </View>

            <View style={styles.content}>
              <Text variant="displaySmall" style={[styles.welcomeText, { color: theme.colors.primary }]}>
                Create Account
              </Text>
              
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                mode="outlined"
                outlineColor="rgba(255,255,255,0.3)"
                activeOutlineColor="#fff"
                textColor="#fff"
                theme={{ colors: { onSurfaceVariant: '#fff' } }}
              />
              
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
                mode="outlined"
                outlineColor="rgba(255,255,255,0.3)"
                activeOutlineColor="#fff"
                textColor="#fff"
                theme={{ colors: { onSurfaceVariant: '#fff' } }}
              />
              
              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                style={styles.input}
                mode="outlined"
                outlineColor="rgba(255,255,255,0.3)"
                activeOutlineColor="#fff"
                textColor="#fff"
                theme={{ colors: { onSurfaceVariant: '#fff' } }}
              />
              
              {error && (
                <Text style={[styles.error, { color: theme.colors.error }]}>
                  {error}
                </Text>
              )}
              
              <Button
                mode="contained"
                onPress={handleSignUp}
                style={styles.button}
                buttonColor={theme.colors.primary}
              >
                Sign Up
              </Button>
              
              <Link href="/(auth)/" asChild>
                <Button 
                  mode="text" 
                  textColor="#fff"
                  style={styles.linkButton}
                >
                  Already have an account? Sign in
                </Button>
              </Link>
            </View>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    color: '#fff',
    marginTop: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  content: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    padding: 24,
  },
  welcomeText: {
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 6,
  },
  linkButton: {
    marginTop: 8,
  },
  error: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#fff',
    backgroundColor: 'rgba(255,59,48,0.2)',
    padding: 8,
    borderRadius: 8,
  },
});
