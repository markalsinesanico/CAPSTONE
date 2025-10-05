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

export default function Receipt() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<'items' | 'rooms'>('items');
  const [itemRequests, setItemRequests] = useState<ItemRequest[]>([]);
  const [roomRequests, setRoomRequests] = useState<RoomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [zoomModalVisible, setZoomModalVisible] = useState(false);
  const [zoomQRData, setZoomQRData] = useState<string>('');


  // Use immersive mode hook
  useImmersiveMode();

  useEffect(() => {
    loadUserEmail();
    fetchUserInfo();
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

  const fetchData = async () => {
    setLoading(true);
    try {
      // Check if user is authenticated
      const token = await AsyncStorage.getItem('token');
      const currentUserEmail = await AsyncStorage.getItem('email');
      
      console.log('Fetching data with token:', token ? 'Present' : 'Missing');
      console.log('User email:', currentUserEmail);
      
      if (!token) {
        Alert.alert('Authentication Required', 'Please log in to view your receipts.');
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
        Alert.alert(
          'Error Fetching Data', 
          `Failed to fetch receipts.\n\nError: ${error.response?.data?.message || error.message}\n\nPlease check your connection and try again.`
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
      
      // Filter data by user's email
      console.log('Filtering by user email:', currentUserEmail);
      
      // Filter item requests by email
      const filteredItemData = itemData.filter((request: any) => {
        const requestEmail = request.email || request.user_email;
        console.log('Item request email:', requestEmail, 'User email:', currentUserEmail);
        return requestEmail === currentUserEmail;
      });
      
      // Filter room requests by email
      const filteredRoomData = roomData.filter((request: any) => {
        const requestEmail = request.email || request.user_email;
        console.log('Room request email:', requestEmail, 'User email:', currentUserEmail);
        return requestEmail === currentUserEmail;
      });
      
      console.log('Filtered item data:', filteredItemData);
      console.log('Filtered room data:', filteredRoomData);
      
      setItemRequests(filteredItemData);
      setRoomRequests(filteredRoomData);
      
      // Only show alert if both are empty and we got successful responses
      if (filteredItemData.length === 0 && filteredRoomData.length === 0) {
        console.log('No receipts found for user - showing info message');
        // Don't show alert immediately, let the UI show the empty state
      }
      
    } catch (error: any) {
      console.error('Unexpected error in fetchData:', error);
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
      // Find the request to check if it's returned
      const allRequests = type === 'item' ? itemRequests : roomRequests;
      const request = allRequests.find(r => r.id === requestId);
      const isReturned = request?.returned;
      
      const action = isReturned ? 'delete' : 'cancel';
      const actionText = isReturned ? 'delete' : 'cancel';
      const actionTitle = isReturned ? 'Delete Request' : 'Cancel Request';
      const actionMessage = isReturned 
        ? 'Are you sure you want to delete this returned request? This action cannot be undone.'
        : 'Are you sure you want to cancel this request? This action cannot be undone.';
      
      Alert.alert(
        actionTitle,
        actionMessage,
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: `Yes, ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
            style: 'destructive',
            onPress: async () => {
              try {
                console.log(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)}ing ${type} request with ID: ${requestId}`);
                
                if (type === 'item') {
                  await API.delete(`/requests/${requestId}`);
                } else {
                  await API.delete(`/room-requests/${requestId}`);
                }
                
                Alert.alert(
                  'Success', 
                  `Your request has been ${actionText}ed successfully.`,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Refresh the data
                        fetchData();
                      }
                    }
                  ]
                );
              } catch (error: any) {
                console.error(`Error ${actionText}ing request:`, error);
                const errorMessage = error.response?.data?.message || `Failed to ${actionText} request. Please try again.`;
                Alert.alert('Error', errorMessage);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error showing action dialog:', error);
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
          <View style={styles.headerInfo}>
            <Text style={styles.receiptTitle}>{request.item?.name || 'Item Request'}</Text>
            <Text style={styles.receiptSubtitle}>{request.name}</Text>
            <Text style={styles.receiptDate}>{formatDate(request.date)}</Text>
          </View>
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
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={[styles.detailValue, request.returned ? styles.returnedText : styles.pendingText]}>
                {request.returned ? 'Returned' : 'Pending'}
              </Text>
            </View>
          </View>

          <View style={styles.cancelButtonSection}>
            <TouchableOpacity 
              style={[styles.cancelRequestButton, request.returned && styles.deleteButton]}
              onPress={() => cancelRequest(request.id, 'item')}
            >
              <FontAwesome5 name={request.returned ? "trash" : "times"} size={14} color="#fff" />
              <Text style={styles.cancelRequestButtonText}>
                {request.returned ? 'Delete Request' : 'Cancel Request'}
              </Text>
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
          <View style={styles.headerInfo}>
            <Text style={styles.receiptTitle}>{request.room?.name || 'Room Request'}</Text>
            <Text style={styles.receiptSubtitle}>{request.name}</Text>
            <Text style={styles.receiptDate}>{formatDate(request.date)}</Text>
          </View>
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
          <View style={styles.detailsSection}>
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
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={[styles.detailValue, request.returned ? styles.returnedText : styles.pendingText]}>
                {request.returned ? 'Returned' : 'Pending'}
              </Text>
            </View>
          </View>

          <View style={styles.cancelButtonSection}>
            <TouchableOpacity 
              style={[styles.cancelRequestButton, request.returned && styles.deleteButton]}
              onPress={() => cancelRequest(request.id, 'room')}
            >
              <FontAwesome5 name={request.returned ? "trash" : "times"} size={14} color="#fff" />
              <Text style={styles.cancelRequestButtonText}>
                {request.returned ? 'Delete Request' : 'Cancel Request'}
              </Text>
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

      <View style={styles.headerContainer}>
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
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {activeTab === 'items' ? (
          Array.isArray(itemRequests) && itemRequests.length > 0 ? (
            itemRequests.map(renderItemReceipt)
          ) : (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="box-open" size={50} color="#ccc" />
              <Text style={styles.emptyText}>No item requests found</Text>
              <Text style={styles.emptySubtext}>
                No item requests found for your email address. Make sure you're logged in with the correct account and have created item requests.
              </Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={fetchData}
              >
                <FontAwesome5 name="sync-alt" size={14} color="#007e3a" />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          Array.isArray(roomRequests) && roomRequests.length > 0 ? (
            roomRequests.map(renderRoomReceipt)
          ) : (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="door-closed" size={50} color="#ccc" />
              <Text style={styles.emptyText}>No room requests found</Text>
              <Text style={styles.emptySubtext}>
                No room requests found for your email address. Make sure you're logged in with the correct account and have created room requests.
              </Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={fetchData}
              >
                <FontAwesome5 name="sync-alt" size={14} color="#007e3a" />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
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
            <Text style={styles.zoomInstructions}>z
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
  headerInfo: {
    flex: 1,
    marginRight: 16,
  },
  receiptTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  receiptSubtitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
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
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#007e3a',
  },
  retryButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#007e3a',
  },
  returnedText: {
    color: '#28a745',
    fontWeight: '600',
  },
  pendingText: {
    color: '#ffc107',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
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

