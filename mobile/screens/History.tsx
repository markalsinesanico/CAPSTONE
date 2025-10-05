import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  ActivityIndicator,
  Image,
  Modal,
  Animated
} from 'react-native';
import { useImmersiveMode } from '../src/useImmersiveMode';
import { FontAwesome5 } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import Header from '../navigation/Header';
import Footer from '../navigation/Footer';
import API from '../src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import SimpleAlert from '../src/components/SimpleAlert';
import { useCustomAlert } from '../src/hooks/useCustomAlert';

const { width } = Dimensions.get('window');

interface ItemRequest {
  id: number;
  name: string;
  borrower_id: string;
  year: string;
  department: string;
  course: string;
  date: string;
  time_in: string;
  time_out: string;
  type: 'item';
  returned?: boolean;
  item?: {
    id: number;
    name: string;
    image_url?: string;
  };
  itemUnit?: {
    id: number;
    unit_code: string;
    qr_url: string;
  };
}

interface RoomRequest {
  id: number;
  name: string;
  borrower_id: string;
  year: string;
  department: string;
  course: string;
  date: string;
  time_in: string;
  time_out: string;
  type: 'room';
  returned?: boolean;
  room?: {
    id: number;
    name: string;
  };
}

export default function History() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<'items' | 'rooms'>('items');
  const [returnedItemRequests, setReturnedItemRequests] = useState<ItemRequest[]>([]);
  const [returnedRoomRequests, setReturnedRoomRequests] = useState<RoomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [zoomModalVisible, setZoomModalVisible] = useState(false);
  const [zoomQRData, setZoomQRData] = useState<string>('');
  
  // Custom alert hook
  const { alertState, showSuccess, showError, showWarning, showInfo, hideAlert } = useCustomAlert();
  
  // Use immersive mode hook
  useImmersiveMode();

  useEffect(() => {
    loadUserEmail();
    fetchUserInfo();
    fetchReturnedData();
  }, []);

  const loadUserEmail = async () => {
    try {
      const stored = await AsyncStorage.getItem('email');
      if (stored) setUserEmail(stored);
    } catch (error) {
      console.error('Error loading email:', error);
    }
  };

  const fetchUserInfo = async () => {
    try {
      console.log('Fetching user information...');
      const response = await API.get('/user-info');
      console.log('User info response:', response.data);
      setUserInfo(response.data);
    } catch (error: any) {
      console.error('Error fetching user info:', error.response?.data || error.message);
      // Fallback to stored email if API fails
      const storedEmail = await AsyncStorage.getItem('email');
      if (storedEmail) {
        setUserInfo({ email: storedEmail });
      }
    }
  };

  const fetchReturnedData = async () => {
    setLoading(true);
    try {
      // Check if user is authenticated
      const token = await AsyncStorage.getItem('token');
      const currentUserEmail = await AsyncStorage.getItem('email');
      
      console.log('Fetching returned data with token:', token ? 'Present' : 'Missing');
      console.log('User email:', currentUserEmail);
      
      if (!token) {
        showWarning('Authentication Required', 'Please log in to view your history.');
        setLoading(false);
        return;
      }
      
      // Try to fetch both item and room requests
      let itemRes, roomRes;
      
      try {
        console.log('Attempting to fetch requests...');
        [itemRes, roomRes] = await Promise.all([
          API.get('/requests'),
          API.get('/room-requests')
        ]);
        
        console.log('Item requests response:', itemRes.data);
        console.log('Room requests response:', roomRes.data);
        
      } catch (error: any) {
        console.error('Error fetching requests:', error.response?.data || error.message);
        showError(
          'Error Fetching Data', 
          `Failed to fetch history. Please check your connection and try again.\n\nError: ${error.response?.data?.message || error.message}`
        );
        setLoading(false);
        return;
      }
      
      // Handle the data with better parsing
      let itemData = [];
      let roomData = [];
      
      // Handle item requests - try multiple data structures
      if (itemRes && itemRes.data) {
        if (Array.isArray(itemRes.data)) {
          itemData = itemRes.data;
        } else if (itemRes.data.data && Array.isArray(itemRes.data.data)) {
          itemData = itemRes.data.data;
        } else if (itemRes.data.requests && Array.isArray(itemRes.data.requests)) {
          itemData = itemRes.data.requests;
        }
      }
      
      // Handle room requests - try multiple data structures
      if (roomRes && roomRes.data) {
        if (Array.isArray(roomRes.data)) {
          roomData = roomRes.data;
        } else if (roomRes.data.data && Array.isArray(roomRes.data.data)) {
          roomData = roomRes.data.data;
        } else if (roomRes.data.requests && Array.isArray(roomRes.data.requests)) {
          roomData = roomRes.data.requests;
        }
      }
      
      console.log('Parsed item data:', itemData);
      console.log('Parsed room data:', roomData);
      
      // Filter data by user's email and only returned items
      console.log('Filtering by user email and returned status:', currentUserEmail);
      
      // Filter item requests by email and returned status
      const filteredItemData = itemData.filter((request: any) => {
        const requestEmail = request.email || request.user_email;
        const isReturned = request.returned === true;
        console.log('Item request email:', requestEmail, 'User email:', currentUserEmail, 'Returned:', isReturned);
        return requestEmail === currentUserEmail && isReturned;
      });
      
      // Filter room requests by email and returned status
      const filteredRoomData = roomData.filter((request: any) => {
        const requestEmail = request.email || request.user_email;
        const isReturned = request.returned === true;
        console.log('Room request email:', requestEmail, 'User email:', currentUserEmail, 'Returned:', isReturned);
        return requestEmail === currentUserEmail && isReturned;
      });
      
      console.log('Filtered returned item data:', filteredItemData);
      console.log('Filtered returned room data:', filteredRoomData);
      
      setReturnedItemRequests(filteredItemData);
      setReturnedRoomRequests(filteredRoomData);
      
      // Show info if no returned items found
      if (filteredItemData.length === 0 && filteredRoomData.length === 0) {
        console.log('No returned items found for user');
      }
      
    } catch (error: any) {
      console.error('Unexpected error in fetchReturnedData:', error);
      setReturnedItemRequests([]);
      setReturnedRoomRequests([]);
      showError('Error', 'Failed to load history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const formattedHour = ((h + 11) % 12 + 1);
    return `${formattedHour}:${minutes} ${suffix}`;
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const openZoomModal = (qrData: string) => {
    setZoomQRData(qrData);
    setZoomModalVisible(true);
  };

  const closeZoomModal = () => {
    setZoomModalVisible(false);
    setZoomQRData('');
  };


  const renderReturnedItemReceipt = (request: ItemRequest) => {
    // Generate QR code data for this receipt
    const qrData = {
      type: 'returned_item_request_receipt',
      requestId: request.id,
      borrowerName: request.name,
      schoolId: request.borrower_id,
      year: request.year,
      department: request.department,
      course: request.course,
      date: request.date,
      timeIn: request.time_in,
      timeOut: request.time_out,
      itemName: request.item?.name || 'N/A',
      unitCode: request.itemUnit?.unit_code || 'N/A',
      timestamp: new Date().toISOString()
    };

    return (
      <View key={request.id} style={styles.compactCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">{request.item?.name || 'Item Request'}</Text>
            <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">{request.name}</Text>
            <Text style={styles.dateTime} numberOfLines={1} ellipsizeMode="tail">
              {formatDate(request.date)} • {formatTime(request.time_in)} - {formatTime(request.time_out)}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.qrWithZoomContainer}>
              <QRCode
                value={JSON.stringify(qrData)}
                size={50}
                color="#000000"
                backgroundColor="#FFFFFF"
                logoSize={12}
                logoMargin={1}
                logoBorderRadius={6}
              />
              <TouchableOpacity 
                style={styles.zoomIcon}
                onPress={() => openZoomModal(JSON.stringify(qrData))}
              >
                <FontAwesome5 name="search-plus" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>ID</Text>
              <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">{request.borrower_id}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Year</Text>
              <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">{request.year}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Dept</Text>
              <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">{request.department}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Course</Text>
              <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">{request.course}</Text>
            </View>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={styles.statusBadge}>
              <FontAwesome5 name="check-circle" size={12} color="#28a745" />
              <Text style={styles.statusText}>Returned</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderReturnedRoomReceipt = (request: RoomRequest) => {
    // Generate QR code data for this room receipt
    const qrData = {
      type: 'returned_room_request_receipt',
      requestId: request.id,
      borrowerName: request.name,
      schoolId: request.borrower_id,
      year: request.year,
      department: request.department,
      course: request.course,
      date: request.date,
      timeIn: request.time_in,
      timeOut: request.time_out,
      roomName: request.room?.name || 'N/A',
      timestamp: new Date().toISOString()
    };

    return (
      <View key={request.id} style={styles.compactCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">{request.room?.name || 'Room Request'}</Text>
            <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">{request.name}</Text>
            <Text style={styles.dateTime} numberOfLines={1} ellipsizeMode="tail">
              {formatDate(request.date)} • {formatTime(request.time_in)} - {formatTime(request.time_out)}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.qrWithZoomContainer}>
              <QRCode
                value={JSON.stringify(qrData)}
                size={50}
                color="#000000"
                backgroundColor="#FFFFFF"
                logoSize={12}
                logoMargin={1}
                logoBorderRadius={6}
              />
              <TouchableOpacity 
                style={styles.zoomIcon}
                onPress={() => openZoomModal(JSON.stringify(qrData))}
              >
                <FontAwesome5 name="search-plus" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>ID</Text>
              <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">{request.borrower_id}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Year</Text>
              <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">{request.year}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Dept</Text>
              <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">{request.department}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Course</Text>
              <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">{request.course}</Text>
            </View>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={styles.statusBadge}>
              <FontAwesome5 name="check-circle" size={12} color="#28a745" />
              <Text style={styles.statusText}>Returned</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007e3a" />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
        <Footer />
      </View>
    );
  }

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

      <View style={styles.headerContainer}>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'items' && styles.activeTab]}
            onPress={() => setActiveTab('items')}
          >
            <FontAwesome5 name="box" size={16} color={activeTab === 'items' ? '#fff' : '#007e3a'} />
            <Text style={[styles.tabText, activeTab === 'items' && styles.activeTabText]}>
              Items ({returnedItemRequests?.length || 0})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'rooms' && styles.activeTab]}
            onPress={() => setActiveTab('rooms')}
          >
            <FontAwesome5 name="door-open" size={16} color={activeTab === 'rooms' ? '#fff' : '#007e3a'} />
            <Text style={[styles.tabText, activeTab === 'rooms' && styles.activeTabText]}>
              Rooms ({returnedRoomRequests?.length || 0})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {activeTab === 'items' ? (
          Array.isArray(returnedItemRequests) && returnedItemRequests.length > 0 ? (
            returnedItemRequests.map(renderReturnedItemReceipt)
          ) : (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="box-open" size={50} color="#ccc" />
              <Text style={styles.emptyText}>No returned items found</Text>
              <Text style={styles.emptySubtext}>
                No returned item requests found in your history. Items will appear here once they are returned.
              </Text>
            </View>
          )
        ) : (
          Array.isArray(returnedRoomRequests) && returnedRoomRequests.length > 0 ? (
            returnedRoomRequests.map(renderReturnedRoomReceipt)
          ) : (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="door-closed" size={50} color="#ccc" />
              <Text style={styles.emptyText}>No returned rooms found</Text>
              <Text style={styles.emptySubtext}>
                No returned room requests found in your history. Rooms will appear here once they are returned.
              </Text>
            </View>
          )
        )}
      </ScrollView>

      <View style={styles.cancelButtonContainer}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5 name="times" size={16} color="#fff" />
          <Text style={styles.cancelButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
      <Footer />

      {/* Zoom Modal */}
      <Modal
        visible={zoomModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeZoomModal}
      >
        <View style={styles.zoomModalOverlay}>
          <View style={styles.zoomModalContainer}>
            <View style={styles.zoomModalHeader}>
              <Text style={styles.zoomModalTitle}>QR Code</Text>
              <TouchableOpacity 
                style={styles.zoomCloseButton}
                onPress={closeZoomModal}
              >
                <FontAwesome5 name="times" size={20} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.zoomQRContainer}>
              <QRCode
                value={zoomQRData}
                size={250}
                color="#000000"
                backgroundColor="#FFFFFF"
                logoSize={30}
                logoMargin={3}
                logoBorderRadius={15}
              />
            </View>
            <Text style={styles.zoomInstructions}>
              Scan this QR code with the Dashboard scanner
            </Text>
          </View>
        </View>
      </Modal>

      {/* Simple Alert */}
      <SimpleAlert
        visible={alertState.visible}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={hideAlert}
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  headerContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    zIndex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#007e3a',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#007e3a',
  },
  activeTabText: {
    color: '#fff',
  },
  scrollContainer: {
    flex: 1,
    zIndex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  compactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  cardHeader: {
    backgroundColor: '#007e3a',
    padding: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerRight: {
    alignItems: 'center',
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  dateTime: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  cardContent: {
    padding: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  infoItem: {
    width: '50%',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  statusText: {
    fontSize: 11,
    color: '#28a745',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  returnedText: {
    color: '#28a745',
    fontWeight: '600',
  },
  cancelButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    zIndex: 1,
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  qrWithZoomContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  zoomIcon: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  zoomModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  zoomModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  zoomModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  zoomCloseButton: {
    padding: 5,
  },
  zoomQRContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },
  zoomInstructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
