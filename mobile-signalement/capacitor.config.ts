import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.signalement.app',
  appName: 'Signalement',
  webDir: 'dist',
  server: {
    // En dev, décommenter pour live reload (remplacer par ton IP locale)
    // url: 'http://192.168.x.x:5173',
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1e40af',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
