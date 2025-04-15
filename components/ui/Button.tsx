import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { lightTheme } from '../../theme';

type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'gradient';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradientColors?: string[];
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

function Button({
  onPress,
  title,
  variant = 'solid',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  gradientColors = lightTheme.colors.gradient.primary,
  icon,
  fullWidth = false,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.96, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const getBgColorByVariant = () => {
    switch (variant) {
      case 'solid':
        return lightTheme.colors.primary;
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return 'transparent';
    }
  };

  const getTextColorByVariant = () => {
    switch (variant) {
      case 'solid':
      case 'gradient':
        return '#ffffff';
      case 'outline':
      case 'ghost':
        return lightTheme.colors.primary;
      default:
        return lightTheme.colors.primary;
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'small':
        return {
          container: {
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 8,
          },
          text: {
            fontSize: 14,
          },
        };
      case 'large':
        return {
          container: {
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: 12,
          },
          text: {
            fontSize: 18,
          },
        };
      default: // medium
        return {
          container: {
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 10,
          },
          text: {
            fontSize: 16,
          },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const buttonStyles = [
    styles.button,
    sizeStyles.container,
    {
      backgroundColor: getBgColorByVariant(),
      borderWidth: variant === 'outline' ? 2 : 0,
      borderColor: variant === 'outline' ? lightTheme.colors.primary : undefined,
      width: fullWidth ? '100%' as const : undefined,
      opacity: disabled ? 0.6 : 1,
    },
    style,
  ];

  const textStyles = [
    styles.text,
    sizeStyles.text,
    {
      color: getTextColorByVariant(),
      marginLeft: icon ? 8 : 0,
    },
    textStyle,
  ];

  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator size="small" color={getTextColorByVariant()} />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </>
  );

  if (disabled) {
    if (variant === 'gradient') {
      return (
        <LinearGradient
          colors={['#ccc', '#aaa']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={buttonStyles}
        >
          {renderContent()}
        </LinearGradient>
      );
    }
    return <TouchableOpacity style={buttonStyles}>{renderContent()}</TouchableOpacity>;
  }

  if (variant === 'gradient') {
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={animatedStyle}
        disabled={disabled || loading}
      >
        <AnimatedGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={buttonStyles}
        >
          {renderContent()}
        </AnimatedGradient>
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={variant === 'ghost' ? 0.5 : 0.8}
      style={[animatedStyle, buttonStyles]}
      disabled={disabled || loading}
    >
      {renderContent()}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Button;
