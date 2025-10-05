import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, Platform } from 'react-native';
import { setStatusBarHidden, setStatusBarStyle } from 'expo-status-bar';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/Screen';
import RoomsScreen from './screens/Rooms';
import ProfileScreen from './screens/Profile';
import ReceiptScreen from './screens/Receipt';
import HistoryScreen from './screens/History';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Rooms: undefined;
  Profile: undefined;
  Receipt: undefined;
  History: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    // Hide status bar and navigation bar completely
    setStatusBarHidden(true, 'fade');
    
    if (Platform.OS === 'android') {
      // Hide system navigation bar on Android
      StatusBar.setHidden(true, 'fade');
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('transparent', true);
    }
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login" 
        screenOptions={{ 
          headerShown: false,
          // Hide system UI for all screens
          statusBarHidden: true,
          statusBarTranslucent: true,
          statusBarStyle: 'light',
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{
            statusBarHidden: true,
            statusBarTranslucent: true,
          }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            statusBarHidden: true,
            statusBarTranslucent: true,
          }}
        />
        <Stack.Screen 
          name="Rooms" 
          component={RoomsScreen}
          options={{
            statusBarHidden: true,
            statusBarTranslucent: true,
          }}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{
            statusBarHidden: true,
            statusBarTranslucent: true,
          }}
        />
        <Stack.Screen 
          name="Receipt" 
          component={ReceiptScreen}
          options={{
            statusBarHidden: true,
            statusBarTranslucent: true,
          }}
        />
        <Stack.Screen 
          name="History" 
          component={HistoryScreen}
          options={{
            statusBarHidden: true,
            statusBarTranslucent: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}