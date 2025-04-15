import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { lightTheme } from '../../theme';

interface CardProps {
  title?: string;
  subtitle?: string;
  content?: string;
  onPress?: () => void;
  style?: ViewStyle;
  gradient?: boolean;
  gradientColors?: string[];
  children?: React.ReactNode;
  icon?: React.ReactNode;
  rightContent?: React.ReactNode;
  elevation?: number;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

function Card({
  title,
  subtitle,
  content,
  onPress,
  style,
  gradient = false,
  gradientColors = lightTheme.colors.gradient.primary,
  children,
  icon,
  rightContent,
  elevation = 1,
}: CardProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const cardStyles = [
    styles.card,
    {
      elevation,
      shadowOpacity: elevation * 0.05,
      shadowRadius: elevation * 2,
    },
    style,
  ];

  const renderCardContent = () => (
    <>
      {(title || subtitle || icon || rightContent) && (
        <View style={[styles.header, { paddingHorizontal: gradient ? 0 : 20, paddingVertical: gradient ? 0 : 16 }]}>
          <View style={styles.headerLeft}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <View style={styles.titleContainer}>
              {title && <Text style={styles.title}>{title}</Text>}
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          </View>
          {rightContent && <View>{rightContent}</View>}
        </View>
      )}
      {content && (
        <Text style={[styles.content, { paddingHorizontal: gradient ? 0 : 20, paddingBottom: gradient ? 0 : 16 }]}>
          {content}
        </Text>
      )}
      {children && (
        <View style={[styles.childrenContainer, { padding: gradient ? 0 : 16 }]}>
          {children}
        </View>
      )}
    </>
  );

  const containerProps = onPress
    ? {
        onPress,
        onPressIn: handlePressIn,
        onPressOut: handlePressOut,
        activeOpacity: 0.9,
      }
    : {};

  const Container = onPress ? AnimatedTouchable : AnimatedView;

  if (gradient) {
    // Ensure we have at least two colors for the gradient
    const safeGradientColors: [string, string, ...string[]] = 
      Array.isArray(gradientColors) && gradientColors.length >= 2 
        ? [gradientColors[0], gradientColors[1], ...gradientColors.slice(2)]
        : [lightTheme.colors.primary, lightTheme.colors.accent];
      
    return (
      <Container style={[animatedStyle, cardStyles]} {...containerProps}>
        <LinearGradient 
          colors={safeGradientColors} 
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {renderCardContent()}
        </LinearGradient>
      </Container>
    );
  }

  return (
    <Container style={[animatedStyle, cardStyles]} {...containerProps}>
      {renderCardContent()}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
  },
  gradient: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  childrenContainer: {},
});

export default Card;
