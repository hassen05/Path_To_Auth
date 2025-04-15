import { DefaultTheme, DarkTheme } from 'react-native-paper';
import { Platform } from 'react-native';

export interface CustomThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  accent: string;
  error: string;
  text: string;
  subtext: string;
  disabled: string;
  placeholder: string;
  backdrop: string;
  notification: string;
  card: string;
  gradient: {
    primary: string[];
    secondary: string[];
    journal: string[];
    reflect: string[];
    insights: string[];
    progress: string[];
    profile: string[];
  };
}

export interface CustomTheme {
  dark: boolean;
  mode?: 'adaptive' | 'exact';
  roundness: number;
  colors: CustomThemeColors;
  fonts: {
    regular: { fontFamily: string; fontWeight?: string };
    medium: { fontFamily: string; fontWeight?: string };
    light: { fontFamily: string; fontWeight?: string };
    thin: { fontFamily: string; fontWeight?: string };
  };
  animation: {
    scale: number;
  };
}

// Font configuration
const fontConfig = {
  regular: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '400' as '400',
  },
  medium: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    fontWeight: '500' as '500',
  },
  light: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-light',
    fontWeight: '300' as '300',
  },
  thin: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-thin',
    fontWeight: '100' as '100',
  },
};

// Light theme
export const lightTheme: CustomTheme = {
  ...DefaultTheme,
  dark: false,
  roundness: 12,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6c5ce7',
    secondary: '#a29bfe',
    background: '#f9f9f9',
    surface: '#ffffff',
    accent: '#ff7675',
    error: '#d63031',
    text: '#2d3436',
    subtext: '#636e72',
    disabled: '#b2bec3',
    placeholder: '#b2bec3',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#ff7675',
    card: '#ffffff',
    gradient: {
      primary: ['#6c5ce7', '#4834d4'],
      secondary: ['#a29bfe', '#6c5ce7'],
      journal: ['#4568dc', '#b06ab3'],
      reflect: ['#11998e', '#38ef7d'],
      insights: ['#2193b0', '#6dd5ed'],
      progress: ['#f953c6', '#b91d73'],
      profile: ['#8e2de2', '#4a00e0'],
    },
  },
  fonts: fontConfig,
  animation: {
    scale: 1.0,
  },
};

// Dark theme
export const darkTheme: CustomTheme = {
  ...DarkTheme,
  dark: true,
  roundness: 12,
  colors: {
    ...DarkTheme.colors,
    primary: '#a29bfe',
    secondary: '#6c5ce7',
    background: '#18191A',
    surface: '#242526',
    accent: '#ff7675',
    error: '#ff6b6b',
    text: '#e4e6eb',
    subtext: '#b0b3b8',
    disabled: '#3E4042',
    placeholder: '#3E4042',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#ff7675',
    card: '#242526',
    gradient: {
      primary: ['#a29bfe', '#6c5ce7'],
      secondary: ['#6c5ce7', '#4834d4'],
      journal: ['#4568dc', '#b06ab3'],
      reflect: ['#11998e', '#38ef7d'],
      insights: ['#2193b0', '#6dd5ed'],
      progress: ['#f953c6', '#b91d73'],
      profile: ['#8e2de2', '#4a00e0'],
    },
  },
  fonts: fontConfig,
  animation: {
    scale: 1.0,
  },
};

// Theme context interface
export interface ThemeContextType {
  theme: CustomTheme;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  themeType: 'light' | 'dark' | 'system';
}

// Export animations constants
export const animations = {
  scaleButton: {
    pressed: 0.96,
    normal: 1,
    duration: 150,
  },
  fadeInOut: {
    duration: 200,
  },
  stagger: {
    interval: 50,
  },
  spring: {
    damping: 18,
    stiffness: 150,
    mass: 1,
  },
  slideTransition: {
    duration: 300,
  },
};
