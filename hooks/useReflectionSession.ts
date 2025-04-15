import { useState, useCallback, useEffect } from 'react';
import { AIService } from '../services/aiService';
import { ReflectionSession, ReflectionQuestion, ReflectionTheme } from '../types/journal';

// Simple ID generation function that doesn't rely on crypto
function generateId(prefix: string = ''): string {
  return prefix + '_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

interface UseReflectionSessionParams {
  userId: string;
  onSessionComplete?: (session: ReflectionSession) => void;
}

interface UseReflectionSessionReturn {
  isLoading: boolean;
  error: string | null;
  currentSession: ReflectionSession | null;
  currentQuestion: ReflectionQuestion | null;
  hasCompletedAllQuestions: boolean;
  analysis: ReflectionSession['analysis'] | null;
  startNewSession: (theme: ReflectionTheme) => Promise<void>;
  answerCurrentQuestion: (answer: string) => Promise<void>;
  loadSavedSession: (sessionId: string) => Promise<void>;
}

function useReflectionSession({ userId, onSessionComplete }: UseReflectionSessionParams): UseReflectionSessionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<ReflectionSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<ReflectionQuestion | null>(null);
  const [hasCompletedAllQuestions, setHasCompletedAllQuestions] = useState(false);
  const [analysis, setAnalysis] = useState<ReflectionSession['analysis'] | null>(null);

  // Update current question when session changes
  useEffect(() => {
    if (!currentSession) {
      setCurrentQuestion(null);
      return;
    }

    const questionIndex = currentSession.current_question_index;
    if (questionIndex < currentSession.questions.length) {
      setCurrentQuestion(currentSession.questions[questionIndex]);
    } else {
      setCurrentQuestion(null);
      setHasCompletedAllQuestions(true);
    }
  }, [currentSession]);

  // Parse AI response to extract question text
  const extractQuestionFromAIResponse = useCallback((aiResponse: string): string => {
    // Simple extraction - just use the full response
    // In a production app, you might want to do more sophisticated parsing
    return aiResponse.trim();
  }, []);

  // Parse analysis response from AI
  const parseAnalysisResponse = useCallback((analysisResponse: string): ReflectionSession['analysis'] => {
    // In a production app, you would want more robust parsing
    // This is a simplified implementation
    
    // Default structure if parsing fails
    const defaultAnalysis: ReflectionSession['analysis'] = {
      negative_patterns: ['Need to parse AI response'],
      positive_patterns: ['Need to parse AI response'],
      affirmations: ['I am growing and learning every day.'],
      actionable_steps: ['Reflect on these insights regularly'],
      encouragement: 'Thank you for your honest reflections.'
    };

    try {
      // Simple extraction based on common formatting
      const negativePatterns = extractBulletPoints(analysisResponse, ['negative patterns', 'patterns to address', 'challenges']);
      const positivePatterns = extractBulletPoints(analysisResponse, ['positive patterns', 'strengths', 'patterns to embrace']);
      const affirmations = extractBulletPoints(analysisResponse, ['affirmations', 'daily affirmations']);
      const actionableSteps = extractBulletPoints(analysisResponse, ['actionable steps', 'steps', 'actions']);
      
      // Extract encouragement (usually the last paragraph)
      const paragraphs = analysisResponse.split('\n\n');
      const encouragement = paragraphs[paragraphs.length - 1] || 'Continue your journey with courage and compassion.';

      return {
        negative_patterns: negativePatterns.length ? negativePatterns : defaultAnalysis.negative_patterns,
        positive_patterns: positivePatterns.length ? positivePatterns : defaultAnalysis.positive_patterns,
        affirmations: affirmations.length ? affirmations : defaultAnalysis.affirmations,
        actionable_steps: actionableSteps.length ? actionableSteps : defaultAnalysis.actionable_steps,
        encouragement: encouragement || defaultAnalysis.encouragement
      };
    } catch (e) {
      console.error('Error parsing analysis response:', e);
      return defaultAnalysis;
    }
  }, []);

  // Helper to extract bullet points from text
  const extractBulletPoints = (text: string, possibleHeaders: string[]): string[] => {
    const lines = text.split('\n');
    let collecting = false;
    const bulletPoints: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      // Check if this line contains a header we're looking for
      if (!collecting && possibleHeaders.some(header => line.includes(header.toLowerCase()))) {
        collecting = true;
        continue;
      }
      
      // If we're collecting and hit a line that might be another header, stop collecting
      if (collecting && line.trim() === '') {
        continue;
      }
      
      if (collecting && line.trim() && 
         (line.trim().startsWith('-') || line.trim().startsWith('•') || /^\d+\./.test(line.trim()) || 
          (i + 1 < lines.length && lines[i + 1].trim() === ''))) {
        // If any other header is found, stop collecting
        if (possibleHeaders.some(header => header !== possibleHeaders[0] && line.includes(header.toLowerCase()))) {
          collecting = false;
          continue;
        }
        
        // Clean up the bullet point
        let point = line.trim();
        if (point.startsWith('-') || point.startsWith('•')) {
          point = point.substring(1).trim();
        }
        if (/^\d+\./.test(point)) {
          point = point.substring(point.indexOf('.') + 1).trim();
        }
        
        bulletPoints.push(point);
      }
    }

    return bulletPoints;
  };

  // Start a new reflection session with the selected theme
  const startNewSession = useCallback(async (theme: ReflectionTheme) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate the first question from AI
      const aiResponse = await AIService.generateReflectionQuestions(theme.name);
      const questionText = extractQuestionFromAIResponse(aiResponse);
      
      // Create first question
      const firstQuestion: ReflectionQuestion = {
        id: generateId('question'),
        question: questionText,
        theme_id: theme.id,
        order: 1,
        created_at: new Date().toISOString()
      };
      
      // Create a new session
      const newSession: ReflectionSession = {
        id: generateId('session'),
        user_id: userId,
        theme_id: theme.id,
        theme_name: theme.name,
        questions: [firstQuestion],
        current_question_index: 0,
        status: 'in_progress',
        started_at: new Date().toISOString()
      };
      
      setCurrentSession(newSession);
      setHasCompletedAllQuestions(false);
      setAnalysis(null);
    } catch (e) {
      setError('Failed to start reflection session. Please try again.');
      console.error('Error starting reflection session:', e);
    } finally {
      setIsLoading(false);
    }
  }, [userId, extractQuestionFromAIResponse]);

  // Answer the current question and get the next one
  const answerCurrentQuestion = useCallback(async (answer: string) => {
    if (!currentSession || !currentQuestion) {
      setError('No active question to answer');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Update the current question with the answer
      const updatedQuestions = [...currentSession.questions];
      const currentIndex = currentSession.current_question_index;
      updatedQuestions[currentIndex] = {
        ...updatedQuestions[currentIndex],
        answer
      };
      
      // Prepare questions and answers for AI
      const questionsAndAnswers = updatedQuestions
        .filter(q => q.answer !== undefined)
        .map(q => ({
          question: q.question,
          answer: q.answer || ''
        }));
      
      // Check if this is the last question (10th)
      const isLastQuestion = currentIndex === 9;
      let nextSession: ReflectionSession;
      
      if (isLastQuestion) {
        // Generate the analysis after the 10th question
        const analysisResponse = await AIService.continueReflectionDialog(
          currentSession.theme_name,
          questionsAndAnswers,
          true
        );
        
        // Parse the analysis response
        const parsedAnalysis = parseAnalysisResponse(analysisResponse);
        setAnalysis(parsedAnalysis);
        
        // Complete the session
        nextSession = {
          ...currentSession,
          questions: updatedQuestions,
          status: 'completed',
          completed_at: new Date().toISOString(),
          analysis: parsedAnalysis,
          current_question_index: currentIndex + 1
        };
        
        setHasCompletedAllQuestions(true);
        
        // Notify if callback provided
        if (onSessionComplete) {
          onSessionComplete(nextSession);
        }
      } else {
        // Get the next question
        const aiResponse = await AIService.continueReflectionDialog(
          currentSession.theme_name,
          questionsAndAnswers,
          false
        );
        
        const nextQuestionText = extractQuestionFromAIResponse(aiResponse);
        
        // Create the next question
        const nextQuestion: ReflectionQuestion = {
          id: generateId('question'),
          question: nextQuestionText,
          theme_id: currentSession.theme_id,
          order: currentIndex + 2, // Order is 1-based
          created_at: new Date().toISOString()
        };
        
        // Add the new question to the session
        nextSession = {
          ...currentSession,
          questions: [...updatedQuestions, nextQuestion],
          current_question_index: currentIndex + 1
        };
      }
      
      setCurrentSession(nextSession);
    } catch (e) {
      setError('Failed to process your answer. Please try again.');
      console.error('Error processing question answer:', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, currentQuestion, extractQuestionFromAIResponse, parseAnalysisResponse, onSessionComplete]);

  // Load a saved session
  const loadSavedSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real app, this would fetch from Supabase
      // For now, we'll just show an error
      setError('Loading saved sessions is not implemented yet.');
    } catch (e) {
      setError('Failed to load the session. Please try again.');
      console.error('Error loading session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    currentSession,
    currentQuestion,
    hasCompletedAllQuestions,
    analysis,
    startNewSession,
    answerCurrentQuestion,
    loadSavedSession
  };
}

export default useReflectionSession;
