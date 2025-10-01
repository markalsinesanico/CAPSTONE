import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  Alert,
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
  room?: {
    id: number;
    name: string;
  };
}

export default function Receipt() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<'items' | 'rooms'>('items');
  const [itemRequests, setItemRequests] = useState<ItemRequest[]>([]);
  const [roomRequests, setRoomRequests] = useState<RoomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');
  const [zoomModalVisible, setZoomModalVisible] = useState(false);
  const [zoomQRData, setZoomQRData] = useState<string>('');


  // Use immersive mode hook
  useImmersiveMode();

  useEffect(() => {
    loadUserEmail();
    fetchData();
  }, []);


  // Test function to verify API connectivity
  const testAPI = async () => {
    try {
      console.log('Testing API connectivity...');
      const response = await API.get('/user-info');
      console.log('User info response:', response.data);
      
      // Test database connection
      try {
        const dbResponse = await API.get('/db-test');
        console.log('Database test response:', dbResponse.data);
        
        // Log detailed information about items and units
        if (dbResponse.data.sample_item) {
          console.log('Sample item with units:', JSON.stringify(dbResponse.data.sample_item, null, 2));
        }
        if (dbResponse.data.sample_request) {
          console.log('Sample request with itemUnit:', JSON.stringify(dbResponse.data.sample_request, null, 2));
        }
      } catch (dbError: any) {
        console.log('Database test failed:', dbError.response?.data || dbError.message);
      }
      
      // Also test if there are any items available
      try {
        const itemsResponse = await API.get('/items');
        console.log('Available items:', itemsResponse.data);
        console.log('Items count:', itemsResponse.data?.length || 0);
      } catch (itemsError: any) {
        console.log('Could not fetch items:', itemsError.response?.data || itemsError.message);
      }
    } catch (error: any) {
      console.error('API test failed:', error.response?.data || error.message);
    }
  };

  // Call test function on mount
  useEffect(() => {
    testAPI();
  }, []);

  // Debug log to see state changes
  useEffect(() => {
    console.log('itemRequests state:', itemRequests);
    console.log('roomRequests state:', roomRequests);
  }, [itemRequests, roomRequests]);

  const loadUserEmail = async () => {
    try {
      const stored = await AsyncStorage.getItem('email');
      if (stored) setUserEmail(stored);
    } catch (error) {
      console.error('Error loading email:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Starting to fetch data...');
      
      // Check if user is authenticated
      const token = await AsyncStorage.getItem('token');
      const userEmail = await AsyncStorage.getItem('email');
      console.log('Token exists:', !!token);
      console.log('User email:', userEmail);
      
      if (!token) {
        Alert.alert('Authentication Required', 'Please log in to view your receipts.');
        setLoading(false);
        return;
      }
      
      // Try user-specific endpoints first, fallback to general endpoints
      let itemRes, roomRes;
      
      try {
        console.log('Trying user-specific endpoints...');
        [itemRes, roomRes] = await Promise.all([
          API.get('/user/requests'),
          API.get('/user/room-requests')
        ]);
        console.log('User-specific endpoints successful');
      } catch (userError: any) {
        console.log('User-specific endpoints failed:', userError.response?.data || userError.message);
        console.log('Trying general endpoints...');
        [itemRes, roomRes] = await Promise.all([
          API.get('/requests'),
          API.get('/room-requests')
        ]);
        console.log('General endpoints successful');
      }
      
      console.log('Item response:', itemRes.data);
      console.log('Room response:', roomRes.data);
      console.log('Item response type:', typeof itemRes.data, 'Is array:', Array.isArray(itemRes.data));
      console.log('Room response type:', typeof roomRes.data, 'Is array:', Array.isArray(roomRes.data));
      
      // Handle the data more carefully
      let itemData = [];
      let roomData = [];
      
      // Handle new debug format for item requests
      if (itemRes.data && itemRes.data.requests) {
        console.log('Item debug info:', itemRes.data.debug);
        itemData = Array.isArray(itemRes.data.requests) ? itemRes.data.requests : [];
      } else if (Array.isArray(itemRes.data)) {
        itemData = itemRes.data.filter((item: any) => item.type === 'item');
      } else if (itemRes.data && typeof itemRes.data === 'object') {
        // If it's an object, it might be wrapped in a data property
        const data = itemRes.data.data || itemRes.data;
        if (Array.isArray(data)) {
          itemData = data.filter((item: any) => item.type === 'item');
        }
      }
      
      // Debug: Log the first item to see its structure
      if (itemData.length > 0) {
        console.log('First item data structure:', JSON.stringify(itemData[0], null, 2));
        if (itemData[0].itemUnit) {
          console.log('ItemUnit data:', JSON.stringify(itemData[0].itemUnit, null, 2));
          console.log('QR URL:', itemData[0].itemUnit.qr_url);
          console.log('Unit Code:', itemData[0].itemUnit.unit_code);
        }
      }
      
      // Handle room requests (keeping original format for now)
      if (Array.isArray(roomRes.data)) {
        roomData = roomRes.data.filter((item: any) => item.type === 'room');
      } else if (roomRes.data && typeof roomRes.data === 'object') {
        // If it's an object, it might be wrapped in a data property
        const data = roomRes.data.data || roomRes.data;
        if (Array.isArray(data)) {
          roomData = data.filter((item: any) => item.type === 'room');
        }
      }
      
      console.log('Filtered item data:', itemData);
      console.log('Filtered room data:', roomData);
      console.log('Item data length:', itemData.length);
      console.log('Room data length:', roomData.length);
      
      setItemRequests(itemData);
      setRoomRequests(roomData);
      
      if (itemData.length === 0 && roomData.length === 0) {
        console.log('No receipts found for this user');
        
        // Show detailed debug information
        if (itemRes.data && itemRes.data.debug) {
          const debug = itemRes.data.debug;
          console.log('Debug info:', debug);
          Alert.alert(
            'No Receipts Found', 
            `Debug Info:\n` +
            `User Email: ${debug.user_email}\n` +
            `Total Requests: ${debug.total_requests}\n` +
            `Requests with your email: ${debug.requests_with_user_email}\n` +
            `Requests without email: ${debug.requests_without_email}\n\n` +
            `Make sure you're logged in with the same email you used when creating requests.`
          );
        } else {
          Alert.alert('No Receipts', 'You have no item or room requests yet. Make a request first to see your receipts here.');
        }
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Initialize with empty arrays on error
      setItemRequests([]);
      setRoomRequests([]);
      Alert.alert('Error', 'Failed to load receipts. Please try again.');
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

  const cancelRequest = async (requestId: number, type: 'item' | 'room') => {
    try {
      Alert.alert(
        'Cancel Request',
        'Are you sure you want to cancel this request?',
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Yes',
            style: 'destructive',
            onPress: async () => {
              try {
                if (type === 'item') {
                  await API.delete(`/requests/${requestId}`);
                } else {
                  await API.delete(`/room-requests/${requestId}`);
                }
                Alert.alert('Success', 'Your request has been cancelled successfully.');
                // Refresh the data
                fetchData();
              } catch (error) {
                console.error('Error cancelling request:', error);
                Alert.alert('Error', 'Failed to cancel request. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error showing cancel dialog:', error);
    }
  };

  const openZoomModal = (qrData: string) => {
    setZoomQRData(qrData);
    setZoomModalVisible(true);
  };

  const closeZoomModal = () => {
    setZoomModalVisible(false);
    setZoomQRData('');
  };

  const renderItemReceipt = (request: ItemRequest) => {
    // Generate QR code data for this receipt
    const qrData = {
      type: 'item_request_receipt',
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

    // Debug: Log the QR data being generated
    console.log('Item QR Data:', JSON.stringify(qrData, null, 2));

    return (
      <View key={request.id} style={styles.receiptCard}>
        <View style={styles.receiptHeader}>
          <View style={styles.headerQrContainer}>
            <View style={styles.qrWithZoomContainer}>
              <QRCode
                value={JSON.stringify(qrData)}
                size={80}
                color="#000000"
                backgroundColor="#FFFFFF"
                logoSize={20}
                logoMargin={2}
                logoBorderRadius={10}
              />
              <TouchableOpacity 
                style={styles.zoomIcon}
                onPress={() => openZoomModal(JSON.stringify(qrData))}
              >
                <FontAwesome5 name="search-plus" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

      <View style={styles.receiptContent}>
        <View style={styles.qrSection}>
          {request.itemUnit?.qr_url && (
            <View style={styles.qrContainer}>
              <Text style={styles.qrLabel}>Item QR Code</Text>
              <Image 
                source={{ uri: request.itemUnit.qr_url }} 
                style={styles.qrImage}
                resizeMode="contain"
              />
              {request.itemUnit?.unit_code && (
                <Text style={styles.unitCode}>Unit Code: {request.itemUnit.unit_code}</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>Item</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Item:</Text>
            <Text style={styles.detailValue}>{request.item?.name || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name:</Text>
            <Text style={styles.detailValue}>{request.name}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>School ID:</Text>
            <Text style={styles.detailValue}>{request.borrower_id}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Year:</Text>
            <Text style={styles.detailValue}>{request.year}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Department:</Text>
            <Text style={styles.detailValue}>{request.department}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Course:</Text>
            <Text style={styles.detailValue}>{request.course}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formatDate(request.date)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>
              {formatTime(request.time_in)} - {formatTime(request.time_out)}
            </Text>
          </View>
        </View>

        <View style={styles.cancelButtonSection}>
          <TouchableOpacity 
            style={styles.cancelRequestButton}
            onPress={() => cancelRequest(request.id, 'item')}
          >
            <FontAwesome5 name="times" size={14} color="#fff" />
            <Text style={styles.cancelRequestButtonText}>Cancel Request</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

  const renderRoomReceipt = (request: RoomRequest) => {
    // Generate QR code data for this room receipt
    const qrData = {
      type: 'room_request_receipt',
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

    // Debug: Log the QR data being generated
    console.log('Room QR Data:', JSON.stringify(qrData, null, 2));

    return (
      <View key={request.id} style={styles.receiptCard}>
        <View style={styles.receiptHeader}>
          <View style={styles.headerQrContainer}>
            <View style={styles.qrWithZoomContainer}>
              <QRCode
                value={JSON.stringify(qrData)}
                size={80}
                color="#000000"
                backgroundColor="#FFFFFF"
                logoSize={20}
                logoMargin={2}
                logoBorderRadius={10}
              />
              <TouchableOpacity 
                style={styles.zoomIcon}
                onPress={() => openZoomModal(JSON.stringify(qrData))}
              >
                <FontAwesome5 name="search-plus" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.headerQrLabel}>Room: {request.room?.name || 'N/A'}</Text>
          </View>
        </View>

      <View style={styles.receiptContent}>
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>Room</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Room:</Text>
            <Text style={styles.detailValue}>{request.room?.name || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name:</Text>
            <Text style={styles.detailValue}>{request.name}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>School ID:</Text>
            <Text style={styles.detailValue}>{request.borrower_id}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Year:</Text>
            <Text style={styles.detailValue}>{request.year}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Department:</Text>
            <Text style={styles.detailValue}>{request.department}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Course:</Text>
            <Text style={styles.detailValue}>{request.course}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formatDate(request.date)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>
              {formatTime(request.time_in)} - {formatTime(request.time_out)}
            </Text>
          </View>
        </View>

        <View style={styles.cancelButtonSection}>
          <TouchableOpacity 
            style={styles.cancelRequestButton}
            onPress={() => cancelRequest(request.id, 'room')}
          >
            <FontAwesome5 name="times" size={14} color="#fff" />
            <Text style={styles.cancelRequestButtonText}>Cancel Request</Text>
          </TouchableOpacity>
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
          <Text style={styles.loadingText}>Loading receipts...</Text>
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

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'items' && styles.activeTab]}
          onPress={() => setActiveTab('items')}
        >
          <FontAwesome5 name="box" size={16} color={activeTab === 'items' ? '#fff' : '#007e3a'} />
          <Text style={[styles.tabText, activeTab === 'items' && styles.activeTabText]}>
            Items ({itemRequests?.length || 0})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'rooms' && styles.activeTab]}
          onPress={() => setActiveTab('rooms')}
        >
          <FontAwesome5 name="door-open" size={16} color={activeTab === 'rooms' ? '#fff' : '#007e3a'} />
          <Text style={[styles.tabText, activeTab === 'rooms' && styles.activeTabText]}>
            Rooms ({roomRequests?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {activeTab === 'items' ? (
          Array.isArray(itemRequests) && itemRequests.length > 0 ? (
            itemRequests.map(renderItemReceipt)
          ) : (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="box-open" size={50} color="#ccc" />
              <Text style={styles.emptyText}>No item requests found</Text>
            </View>
          )
        ) : (
          Array.isArray(roomRequests) && roomRequests.length > 0 ? (
            roomRequests.map(renderRoomReceipt)
          ) : (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="door-closed" size={50} color="#ccc" />
              <Text style={styles.emptyText}>No room requests found</Text>
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
          <Text style={styles.cancelButtonText}>Cancel</Text>
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    zIndex: 1,
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
  receiptCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  receiptHeader: {
    backgroundColor: '#007e3a',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  receiptDate: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  receiptContent: {
    padding: 20,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  qrImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  unitCode: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  detailsSection: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
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
  cancelButtonSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  cancelRequestButton: {
    backgroundColor: '#dc3545',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelRequestButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  headerQrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerQrImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    marginBottom: 8,
  },
  headerQrLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  qrWithZoomContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  zoomIcon: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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
