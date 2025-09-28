import { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import { setStatusBarHidden } from 'expo-status-bar';

export const useImmersiveMode = () => {
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Hide status bar
      setStatusBarHidden(true, 'fade');
      StatusBar.setHidden(true, 'fade');
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('transparent', true);
      
      // Try to hide navigation bar using native methods
      try {
        // This will be handled by the app.json configuration
        // and the native Android immersive mode
      } catch (error) {
        console.log('Navigation bar hiding not available:', error);
      }
    }
  }, []);
};
