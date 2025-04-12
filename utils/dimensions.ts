import { Dimensions, Platform, StatusBar } from 'react-native';

// Get screen dimensions
export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Status bar height for safe area calculations
export const StatusBarHeight = Platform.OS === 'ios' 
  ? 44  // Default iOS status bar height
  : StatusBar.currentHeight || 24; // Android status bar height with fallback

// Bottom tab bar height approximation
export const TabBarHeight = 56;

// Bottom safe area padding for notched devices
export const BottomSafeAreaHeight = Platform.OS === 'ios' ? 34 : 0;

// Helper function to calculate responsive sizes based on screen width
export function responsiveSize(size: number): number {
  const baseWidth = 375; // Base width (iPhone X/XS/11 Pro)
  return (SCREEN_WIDTH / baseWidth) * size;
}

// Helper for responsive font sizes
export function responsiveFontSize(size: number): number {
  return responsiveSize(size);
}

// Helper for responsive spacing
export function spacing(multiplier: number = 1): number {
  const baseSpacing = 8;
  return baseSpacing * multiplier;
}
