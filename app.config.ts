import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Path to Authenticity',
  slug: 'path-to-authenticity',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    openrouterApiKey: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY,
    appUrl: process.env.EXPO_PUBLIC_APP_URL,
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
  plugins: ['expo-router', 'expo-font'],
});
