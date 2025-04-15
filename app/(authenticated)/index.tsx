import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  useColorScheme,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/auth';
import { useTheme, Button } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  Extrapolate,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  gradient: string[];
  onPress: () => void;
  index: number;
  isDarkMode: boolean;
}

function safeGradient(colors: string[]): readonly [string, string, ...string[]] {
  if (colors.length < 2) {
    return ['#4facfe', '#00f2fe'] as const;
  }
  return [colors[0], colors[1], ...colors.slice(2)] as const;
}

function FeatureCard({ 
  title, 
  description, 
  icon, 
  gradient, 
  onPress, 
  index,
  isDarkMode 
}: FeatureCardProps) {
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    setTimeout(() => {
      translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
      opacity.value = withSpring(1, { damping: 20, stiffness: 90 });
    }, index * 120);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value } as any,
        { scale: scale.value } as any,
      ],
    };
  });

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 150, easing: Easing.inOut(Easing.ease) });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150, easing: Easing.inOut(Easing.ease) });
  };

  return (
    <AnimatedTouchable
      style={[styles.cardContainer, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={safeGradient(gradient)}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardIcon}>
          <MaterialCommunityIcons name={icon as any} size={32} color="white" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
      </LinearGradient>
    </AnimatedTouchable>
  );
}

function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [quote, setQuote] = useState('');
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const greetingOpacity = useSharedValue(0);
  const quoteOpacity = useSharedValue(0);
  
  useEffect(() => {
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 800 }));
    greetingOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    quoteOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
    
    // Set random quote
    setQuote(getRandomQuote());
  }, []);
  
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));
  
  const greetingStyle = useAnimatedStyle(() => {
    return {
      opacity: greetingOpacity.value,
      transform: [
        { translateY: interpolate(greetingOpacity.value, [0, 1], [20, 0], Extrapolate.CLAMP) } as any,
      ],
    };
  });
  
  const quoteStyle = useAnimatedStyle(() => {
    return {
      opacity: quoteOpacity.value,
      transform: [
        { translateY: interpolate(quoteOpacity.value, [0, 1], [20, 0], Extrapolate.CLAMP) } as any,
      ],
    };
  });

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  const getRandomQuote = () => {
    const quotes = [
      'The journey of self-discovery is the most important adventure you\'ll ever embark on.',
      'Your authentic self isn\'t a destination - it\'s a continuous unfolding.',
      'Every reflection brings you closer to the person you\'re meant to be.',
      'The path to authenticity is paved with honest self-reflection.',
      'True growth begins when you face yourself with compassion.',
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  const features = [
    {
      title: 'Journal',
      description: 'Record your thoughts and track your mood.',
      icon: 'notebook-outline',
      gradient: ['#4facfe', '#00f2fe'],
      onPress: () => router.push('/journal'),
    },
    {
      title: 'Reflections',
      description: 'Guided questions to deepen self-awareness.',
      icon: 'lightbulb-outline',
      gradient: ['#ff9a9e', '#fad0c4'],
      onPress: () => router.push('/reflections'),
    },
    {
      title: 'AI Insights',
      description: 'Get personalized patterns and guidance.',
      icon: 'chat-processing-outline',
      gradient: ['#2193b0', '#6dd5ed'],
      onPress: () => router.push('/insights'),
    },
    {
      title: 'Progress',
      description: 'Visualize your growth and emotional patterns.',
      icon: 'chart-line',
      gradient: ['#f953c6', '#b91d73'],
      onPress: () => router.push('/progress'),
    },
  ];

  return (
    <LinearGradient
      colors={safeGradient(isDarkMode ? ['#1a1a2e', '#16213e'] : ['#f8f9fa', '#eef1f5'])}
      style={styles.gradientBackground}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        
        {/* Header */}
        <Animated.View 
          style={[styles.header, headerStyle, { paddingTop: insets.top > 0 ? 0 : 8 }]}
          entering={FadeIn.delay(100).duration(800)}
        >
          <View style={styles.headerLeft}>
            <Text style={[styles.appName, { color: isDarkMode ? '#fff' : '#333' }]}>
              Path to Authenticity
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => router.push('/profile')}
              style={styles.profileIconContainer}
            >
              <LinearGradient
                colors={safeGradient(['#8e2de2', '#4a00e0'])}
                style={styles.profileGradient}
              >
                <MaterialCommunityIcons name="account" size={24} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Greeting */}
          <Animated.View 
            style={[styles.greetingContainer, greetingStyle]}
            entering={SlideInUp.delay(200).duration(800)}
          >
            <Text style={[styles.greeting, { color: isDarkMode ? '#e0e0e0' : '#555' }]}>
              Good {getTimeOfDay()},
            </Text>
            <Text style={[styles.name, { color: isDarkMode ? '#fff' : '#333' }]}>
              {session?.user?.email?.split('@')[0] || 'Explorer'}
            </Text>
          </Animated.View>

          {/* Quote */}
          <Animated.View 
            style={[styles.quoteContainer, quoteStyle]}
            entering={SlideInUp.delay(300).duration(800)}
          >
            <Text style={[styles.quote, { color: isDarkMode ? '#e0e0e0' : '#555' }]}>
              "{quote}"
            </Text>
          </Animated.View>

          {/* Main Features */}
          <View style={styles.featuresSection}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#333' }]}>
              Continue Your Journey
            </Text>
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                {...feature}
                index={index}
                isDarkMode={isDarkMode}
              />
            ))}
          </View>

          {/* Quick Action */}
          <Animated.View 
            entering={SlideInUp.delay(500).duration(800)}
            style={styles.quickActionContainer}
          >
            <Text style={[styles.quickActionTitle, { color: isDarkMode ? '#fff' : '#333' }]}>
              How are you feeling today?
            </Text>
            <TouchableOpacity 
              style={styles.moodButton}
              onPress={() => router.push('/journal?newEntry=true')}
            >
              <LinearGradient
                colors={safeGradient(['#5f2c82', '#49a09d'])}
                style={styles.moodButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.moodButtonText}>Start a Journal Entry</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  headerLeft: {
    flex: 1,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIconContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  greetingContainer: {
    marginTop: 20,
    marginBottom: 16,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '400',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
  },
  quoteContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#6c5ce7',
  },
  quote: {
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  featuresSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  cardContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 90,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  quickActionContainer: {
    marginBottom: 30,
  },
  quickActionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  moodButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  moodButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  moodButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});


