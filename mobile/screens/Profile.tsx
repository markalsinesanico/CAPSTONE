import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Dimensions } from 'react-native';
import { useImmersiveMode } from '../src/useImmersiveMode';
import { FontAwesome5 } from '@expo/vector-icons';
import Header from '../navigation/Header';
import Footer from '../navigation/Footer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import API from '../src/api';

const { width } = Dimensions.get('window');

export default function Profile() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = React.useState<string>('msanico@ssct.edu.ph');

  React.useEffect(() => {
    let mounted = true;
    const loadEmail = async () => {
      try {
        const stored = await AsyncStorage.getItem('email');
        if (mounted && stored) setEmail(stored);
      } catch {}
    };
    loadEmail();
    return () => { mounted = false; };
  }, []);

  // Use immersive mode hook
  useImmersiveMode();

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      if (API?.defaults?.headers?.common) delete API.defaults.headers.common['Authorization'];
      Alert.alert('Logged out', 'You have been logged out.');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch {
      Alert.alert('Error', 'Unable to logout, please try again.');
    }
  };

  const handleReceipt = () => {
    navigation.navigate('Receipt');
  };

  const handleHistory = () => {
    // Navigate to history screen
    Alert.alert('History', 'History functionality will be implemented here.');
  };



  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.backgroundBubbles}>
        <View style={styles.bubble1} />
        <View style={styles.bubble2} />
        <View style={styles.bubble3} />
        <View style={styles.bubble4} />
        <View style={styles.bubble5} />
        <View style={styles.bubble6} />
        <View style={styles.smallBubble1} />
        <View style={styles.smallBubble2} />
        <View style={styles.smallBubble3} />
        <View style={styles.smallBubble4} />
        <View style={styles.smallBubble5} />
        <View style={styles.smallBubble6} />
        <View style={styles.smallBubble7} />
        <View style={styles.smallBubble8} />
        <View style={styles.smallBubble9} />
        <View style={styles.smallBubble10} />
      </View>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.profileImg}>
            <FontAwesome5 name="user" size={40} color="white" />
          </View>
          <Text style={styles.emailText}>{email}</Text>
          <View style={styles.divider} />

          {/* Enhanced Menu Items */}
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleHistory}>
              <View style={styles.menuLeft}>
                <View style={styles.iconContainer}>
                  <FontAwesome5 name="history" size={20} color="#007e3a" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>History</Text>
                  <Text style={styles.menuSubtitle}>View your order history</Text>
                </View>
              </View>
              <FontAwesome5 name="chevron-right" size={16} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleReceipt}>
              <View style={styles.menuLeft}>
                <View style={styles.iconContainer}>
                  <FontAwesome5 name="receipt" size={20} color="#007e3a" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Receipts</Text>
                  <Text style={styles.menuSubtitle}>View and download receipts</Text>
                </View>
              </View>
              <FontAwesome5 name="chevron-right" size={16} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconContainer, styles.logoutIcon]}>
                  <FontAwesome5 name="sign-out-alt" size={20} color="#dc3545" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={[styles.menuTitle, styles.logoutText]}>Logout</Text>
                  <Text style={styles.menuSubtitle}>Sign out of your account</Text>
                </View>
              </View>
              <FontAwesome5 name="chevron-right" size={16} color="#dc3545" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa',
    position: 'relative',
  },
  backgroundBubbles: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  bubble1: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 126, 58, 0.1)',
    top: 100,
    right: 20,
  },
  bubble2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 166, 81, 0.15)',
    top: 200,
    left: 30,
  },
  bubble3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    top: 350,
    right: 40,
  },
  bubble4: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0, 126, 58, 0.08)',
    top: 500,
    left: 20,
  },
  bubble5: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(0, 166, 81, 0.12)',
    top: 650,
    right: 60,
  },
  bubble6: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    top: 800,
    left: 50,
  },
  smallBubble1: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: 'rgba(0, 126, 58, 0.12)',
    top: 120,
    left: 60,
  },
  smallBubble2: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 166, 81, 0.1)',
    top: 180,
    right: 80,
  },
  smallBubble3: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    top: 250,
    left: 80,
  },
  smallBubble4: {
    position: 'absolute',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: 'rgba(0, 126, 58, 0.08)',
    top: 320,
    right: 20,
  },
  smallBubble5: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 166, 81, 0.12)',
    top: 400,
    left: 40,
  },
  smallBubble6: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    top: 480,
    right: 70,
  },
  smallBubble7: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 126, 58, 0.1)',
    top: 550,
    left: 70,
  },
  smallBubble8: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 166, 81, 0.08)',
    top: 620,
    right: 30,
  },
  smallBubble9: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    top: 700,
    left: 90,
  },
  smallBubble10: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 126, 58, 0.15)',
    top: 750,
    right: 50,
  },
  scrollContainer: {
    flex: 1,
    zIndex: 1,
  },
  profileSection: { 
    alignItems: 'center', 
    marginTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 1,
  },
  profileImg: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: '#007e3a', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 4, 
    borderColor: '#fff', 
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  emailText: { 
    fontSize: 16, 
    fontWeight: '500',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center'
  },
  divider: { 
    width: '100%', 
    height: 1, 
    backgroundColor: '#e9ecef', 
    marginBottom: 30 
  },
  menuContainer: {
    width: '100%',
    gap: 12,
    zIndex: 1,
  },
  menuItem: { 
    width: '100%', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 16, 
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  logoutItem: {
    backgroundColor: '#fff5f5',
    borderColor: '#fed7d7',
  },
  menuLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f8f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logoutIcon: {
    backgroundColor: '#fef2f2',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  logoutText: {
    color: '#dc3545',
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 18,
  },
});
