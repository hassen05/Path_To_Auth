import { MD3LightTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  fontFamily: 'System',
  letterSpacing: 0.25,
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#7E57C2', // Deep purple
    secondary: '#5E35B1',
    tertiary: '#9575CD',
    surface: '#FFFFFF',
    background: '#F5F5F7',
    surfaceVariant: '#F0EEF6',
    error: '#D32F2F',
    onPrimary: '#FFFFFF',
    elevation: {
      level0: 'transparent',
      level1: '#F6F4FB',
      level2: '#F0ECF6',
      level3: '#E9E3F1',
      level4: '#E2DAEC',
      level5: '#DCD3E8',
    },
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: 16,
};

export default theme;
