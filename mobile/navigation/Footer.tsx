
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function Footer() {
  const navigation = useNavigation<NavigationProp>();

  const navigateToScreen = (screen: keyof RootStackParamList) => {
    navigation.navigate(screen);
  };

  return (
    <LinearGradient
      colors={['#007e3a', '#00a651', '#ffd700']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.footer}
    >
      <TouchableOpacity onPress={() => navigateToScreen('Home')} style={styles.iconBlock}>
        <FontAwesome name="home" size={18} color="#fff" />
        <Text style={styles.footerText}>HOME</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigateToScreen('Rooms')} style={styles.iconBlock}>
        <FontAwesome5 name="door-open" size={18} color="#fff" />
        <Text style={styles.footerText}>ROOMS</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigateToScreen('Profile')} style={styles.iconBlock}>
        <FontAwesome name="user" size={18} color="#fff" />
        <Text style={styles.footerText}>PROFILE</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  iconBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 50,
  },
  footerText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});