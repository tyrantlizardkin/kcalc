import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'kcalc',
  slug: 'kcalc',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  backgroundColor: '#191b25',
  ios: { supportsTablet: true },
  android: {
    package: 'com.dyscostic.kcalc',
    adaptiveIcon: {
      backgroundColor: '#191b25',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: { favicon: './assets/favicon.png' },
  extra: {
    eas: { projectId: 'ef728ace-a1f0-472e-82d2-bf3d7d871a37' },
    geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  },
  owner: 'jpcarlson',
  plugins: ['react-native-health-connect'],
};

export default config;
