import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, useTheme, IconButton, Surface, ProgressBar, ActivityIndicator } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { getThemeById } from '../../../data/reflectionThemes';
import useReflectionSession from '../../../hooks/useReflectionSession';
import { useAuth } from '../../../contexts/auth';

export default function Session() {
  const { themeId } = useLocalSearchParams<{ themeId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { session } = useAuth();
  const [answer, setAnswer] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  
  const selectedTheme = themeId ? getThemeById(themeId) : null;

  // Use our custom hook to manage the reflection session
  const {
    isLoading,
    error,
    currentSession,
    currentQuestion,
    hasCompletedAllQuestions,
    analysis,
    startNewSession,
    answerCurrentQuestion,
  } = useReflectionSession({
    userId: session?.user?.id || 'anonymous',
    onSessionComplete: (completedSession) => {
      console.log('Session completed:', completedSession.id);
    },
  });

  // Start a new session when component mounts with the selected theme
  useEffect(() => {
    if (!selectedTheme) {
      router.replace('/reflections');
      return;
    }

    const initSession = async () => {
      await startNewSession(selectedTheme);
    };

    initSession();
  }, [selectedTheme, router, startNewSession]);

  // Handle submitting an answer
  const handleSubmitAnswer = async () => {
    if (!answer.trim() || isLoading) return;
    
    await answerCurrentQuestion(answer.trim());
    setAnswer('');
    
    // Clear focus from input
    inputRef.current?.blur();
  };

  // Calculate progress
  const progress = currentSession 
    ? (currentSession.current_question_index + 1) / 10 
    : 0;

  // Render loading state
  if (isLoading && !currentQuestion) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Preparing your reflection journey...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <View style={styles.errorContainer}>
          <IconButton icon="alert-circle" size={40} iconColor={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            mode="contained" 
            onPress={() => router.replace('/reflections')}
            style={styles.errorButton}
          >
            Back to Themes
          </Button>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <IconButton 
            icon="arrow-left" 
            onPress={() => router.back()} 
            style={styles.backButton}
          />
          <Text style={styles.headerTitle}>
            {selectedTheme?.name || 'Reflection Session'}
          </Text>
        </View>
        <ProgressBar progress={progress} style={styles.progressBar} color={theme.colors.primary} />
        <Text style={styles.progressText}>Question {currentSession?.current_question_index + 1 || 0} of 10</Text>
      </View>
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
        >
          {hasCompletedAllQuestions && analysis ? (
            // Render analysis after all questions are answered
            <View style={styles.analysisContainer}>
              <Text style={styles.analysisTitle}>Your Reflection Analysis</Text>
              
              <Surface style={styles.analysisSection} elevation={1}>
                <Text style={styles.sectionTitle}>Patterns to Address</Text>
                {analysis.negative_patterns.map((pattern, index) => (
                  <Text key={`neg-${index}`} style={styles.patternItem}>
                    • {pattern}
                  </Text>
                ))}
              </Surface>
              
              <Surface style={styles.analysisSection} elevation={1}>
                <Text style={styles.sectionTitle}>Strengths to Embrace</Text>
                {analysis.positive_patterns.map((pattern, index) => (
                  <Text key={`pos-${index}`} style={styles.patternItem}>
                    • {pattern}
                  </Text>
                ))}
              </Surface>
              
              <Surface style={styles.analysisSection} elevation={1}>
                <Text style={styles.sectionTitle}>Daily Affirmations</Text>
                {analysis.affirmations.map((affirmation, index) => (
                  <Text key={`aff-${index}`} style={styles.patternItem}>
                    • {affirmation}
                  </Text>
                ))}
              </Surface>
              
              <Surface style={styles.analysisSection} elevation={1}>
                <Text style={styles.sectionTitle}>Actionable Steps</Text>
                {analysis.actionable_steps.map((step, index) => (
                  <Text key={`step-${index}`} style={styles.patternItem}>
                    • {step}
                  </Text>
                ))}
              </Surface>
              
              <Surface style={styles.analysisSection} elevation={1}>
                <Text style={styles.sectionTitle}>A Message for You</Text>
                <Text style={styles.encouragementText}>{analysis.encouragement}</Text>
              </Surface>
              
              <Button 
                mode="contained" 
                style={styles.doneButton} 
                onPress={() => router.push('/reflections')}
              >
                Return to Themes
              </Button>
            </View>
          ) : currentQuestion ? (
            // Render current question and answer input
            <View style={styles.questionContainer}>
              <Surface style={styles.questionCard} elevation={1}>
                <Text style={styles.questionText}>{currentQuestion.question}</Text>
              </Surface>
              
              <View style={styles.answerContainer}>
                <TextInput
                  ref={inputRef}
                  style={styles.answerInput}
                  value={answer}
                  onChangeText={setAnswer}
                  placeholder="Type your answer here..."
                  multiline
                  placeholderTextColor="#888"
                  blurOnSubmit={false}
                />
                
                <Button 
                  mode="contained" 
                  onPress={handleSubmitAnswer}
                  disabled={!answer.trim() || isLoading}
                  loading={isLoading}
                  style={styles.submitButton}
                >
                  {isLoading ? 'Processing...' : 'Continue'}
                </Button>
              </View>
            </View>
          ) : (
            // Fallback - should rarely show
            <View style={styles.contentContainer}>
              <Text style={styles.themeTitle}>
                {selectedTheme?.name || 'Unknown Theme'}
              </Text>
              <Text style={styles.themeDescription}>
                {selectedTheme?.description || 'Theme description not available'}
              </Text>
              <Button 
                mode="contained" 
                onPress={() => router.back()}
                style={styles.button}
              >
                Back to Themes
              </Button>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
    textAlign: 'right',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  themeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  themeDescription: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  button: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
    opacity: 0.7,
  },
  errorButton: {
    marginTop: 16,
  },
  questionContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  questionCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  questionText: {
    fontSize: 20,
    lineHeight: 28,
  },
  answerContainer: {
    marginTop: 'auto',
  },
  answerInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitButton: {
    borderRadius: 8,
    marginBottom: 16,
  },
  analysisContainer: {
    paddingBottom: 32,
  },
  analysisTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  analysisSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  patternItem: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  encouragementText: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
    opacity: 0.9,
  },
  doneButton: {
    marginTop: 24,
    borderRadius: 8,
    paddingVertical: 8,
  },
});
