// screens/Rooms.tsx
import React, { useEffect, useState } from "react";
import type { JSX } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  FlatList,
  StatusBar,
  ImageBackground,
  Dimensions,
  Animated,
} from "react-native";
import { useImmersiveMode } from '../src/useImmersiveMode';
import axios from "axios";
import Modal from "react-native-modal";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import Header from "../navigation/Header";
import Footer from "../navigation/Footer";
import API from '../src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import SimpleAlert from '../src/components/SimpleAlert';
import { useCustomAlert } from '../src/hooks/useCustomAlert';

const { width, height } = Dimensions.get('window');

const YEAR_OPTIONS = [
  { label: "1st Year", value: "1st" },
  { label: "2nd Year", value: "2nd" },
  { label: "3rd Year", value: "3rd" },
  { label: "4th Year", value: "4th" },
];

const DEPT_OPTIONS = [
  { label: "CEIT", value: "CEIT" },
  { label: "CTE", value: "CTE" },
  { label: "COT", value: "COT" },
  { label: "CAS", value: "CAS" },
];

const COURSE_OPTIONS: Record<string, { label: string; value: string }[]> = {
  CEIT: [
    { label: "Bachelor of Science in Electronics (BSECE)", value: "BSECE" },
    { label: "Bachelor of Science in Electrical (BSEE)", value: "BSEE" },
    { label: "Bachelor of Science in Computer (BSCoE)", value: "BSCoE" },
    { label: "Bachelor of Science in Information Systems (BSIS)", value: "BSIS" },
    { label: "Bachelor of Science in Information Tech (BSInfoTech)", value: "BSInfoTech" },
    { label: "Bachelor of Science in Computer Science (BSCS)", value: "BSCS" },
  ],
  CTE: [
    { label: "BSED - English", value: "BSED-ENGLISH" },
    { label: "BSED - Filipino", value: "BSED-FILIPINO" },
    { label: "BSED - Mathematics", value: "BSED-MATH" },
    { label: "BSED - Sciences", value: "BSED-SCIENCES" },
    { label: "BEED", value: "BEED" },
    { label: "BPED", value: "BPED" },
    { label: "BTVTED", value: "BTVTED" },
  ],
  COT: [
    { label: "Bachelor in Electrical (BEET)", value: "BEET" },
    { label: "Bachelor in Electronics (BEXET)", value: "BEXET" },
    { label: "Bachelor in Mechanical (BMET)", value: "BMET" },
    { label: "Mechanical Technology (BMET-MT)", value: "BMET-MT" },
    { label: "Refrigeration & Aircon (BMET-RAC)", value: "BMET-RAC" },
    { label: "Architectural Drafting (BSIT-ADT)", value: "BSIT-ADT" },
    { label: "Automotive Technology (BSIT-AT)", value: "BSIT-AT" },
    { label: "Electrical Technology (BSIT-ELT)", value: "BSIT-ELT" },
    { label: "Electronics Technology (BSIT-ET)", value: "BSIT-ET" },
    { label: "Mechanical Technology (BSIT-MT)", value: "BSIT-MT" },
    { label: "Welding & Fabrication (BSIT-WAF)", value: "BSIT-WAF" },
    { label: "Heating, Ventilation, AC (BSIT-HVACR)", value: "BSIT-HVACR" },
  ],
  CAS: [
    { label: "Bachelor of Science in Environmental Science (BSES)", value: "BSES" },
    { label: "Bachelor of Science in Mathematics (BSMATH)", value: "BSMATH" },
    { label: "Bachelor of Arts in English Language (BA-EL)", value: "BA-EL" },
  ],
};

type PickerState = {
  type: "date" | "timeIn" | "timeOut" | "";
  visible: boolean;
};

type Room = {
  id: number;
  name: string;
  quantity: number;
};

type RoomBookingRequest = {
  name: string;
  borrower_id: string;
  year: string;
  department: string;
  course: string;
  date: string;
  time_in: string;
  time_out: string;
  room_id: number;
  email?: string;
}

export default function Rooms(): JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  
  // Add auth check on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.replace('Login');
      }
    };
    
    checkAuth();
  }, [navigation]);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Custom alert hook
  const { alertState, showSuccess, showError, showWarning, showInfo, hideAlert } = useCustomAlert();

  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [isModalVisible, setModalVisible] = useState<boolean>(false);

  const [fullName, setFullName] = useState<string>("");
  const [idNumber, setIdNumber] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [course, setCourse] = useState<string>("");

  const [date, setDate] = useState<Date | null>(null);
  const [timeIn, setTimeIn] = useState<Date | null>(null);
  const [timeOut, setTimeOut] = useState<Date | null>(null);

  const [showPicker, setShowPicker] = useState<PickerState>({
    type: "",
    visible: false,
  });


  const fetchRooms = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Error', 'Please login first');
        // Add navigation to login if needed
        return;
      }

      const response = await API.get('/rooms');
      setRooms(response.data);
    } catch (error: any) {
      console.error('Error fetching rooms:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        // Add navigation to login if needed
        return;
      }
      
      Alert.alert('Error', 'Failed to fetch rooms. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchRooms();
  }, []);

  // Use immersive mode hook
  useImmersiveMode();

  const openModal = (room: string) => {
    setSelectedRoom(room);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setShowPicker({ type: "", visible: false });
  };

 const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
  if (Platform.OS === "android") {
    setShowPicker({ type: "", visible: false });
  }
  if (selectedDate) {
    const day = selectedDate.getDay(); // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) {
      setDate(selectedDate);
    } else {
      Alert.alert(
        "Reservation Notice",
        "Room reservations are only available on Saturdays and Sundays.\n\nFor weekday bookings, please visit the office directly.",
        [{ text: "OK", style: "default" }]
      );
      setDate(null); // reset date if invalid
    }
  }
};

const handleTimeChange = (type: "timeIn" | "timeOut") => (event: DateTimePickerEvent, selectedTime?: Date) => {
  if (Platform.OS === "android") {
    setShowPicker({ type: "", visible: false });
  }
  if (selectedTime) {
    if (type === "timeIn") {
      setTimeIn(selectedTime);
    } else if (type === "timeOut") {
      setTimeOut(selectedTime);
    }
  }
};

  const handleSubmit = async () => {
    try {
      // Validate form
      if (!fullName || !idNumber || !year || !department || 
          !course || !date || !timeIn || !timeOut) {
        Alert.alert('Validation Error', 'Please fill in all fields');
        return;
      }

      // Find room ID from selected room name
      const room = rooms.find(r => r.name === selectedRoom);
      if (!room) {
        Alert.alert('Room Not Found', 'Selected room could not be found');
        return;
      }

      // Get user email from storage
      const userEmail = await AsyncStorage.getItem('email');

      // Format the request data
      const requestData: RoomBookingRequest = {
        name: fullName,
        borrower_id: idNumber,
        year: year,
        department: department,
        course: course,
        date: date.toISOString().split('T')[0],
        time_in: timeIn.toTimeString().slice(0, 5), // Format as HH:MM
        time_out: timeOut.toTimeString().slice(0, 5), // Format as HH:MM
        room_id: room.id,
        email: userEmail || undefined // Include user email
      };

      // Submit the request
      const response = await API.post('/room-requests', requestData);

      if (response.status === 201) {
        showSuccess('Success', 'Room booking request has been submitted successfully.');
        // Reset form
        setFullName('');
        setIdNumber('');
        setYear('');
        setDepartment('');
        setCourse('');
        setDate(null);
        setTimeIn(null);
        setTimeOut(null);
        // Close modal
        setModalVisible(false);
      }

    } catch (error: any) {
      console.error('Submit error:', {
        message: error.message,
        response: error.response?.data
      });
      
      // Show appropriate error message based on the error type
      let errorTitle = 'Request Failed';
      let errorMessage = 'Failed to submit room booking request';
      
      if (error.response?.data?.message) {
        const message = error.response.data.message;
        if (message.includes('fully booked') || message.includes('not available') || message.includes('conflict')) {
          errorTitle = 'Room Fully Booked';
          errorMessage = 'This room is fully booked for the selected time range. Please choose a different time or room.';
        } else if (message.includes('validation') || message.includes('required')) {
          errorTitle = 'Validation Error';
          errorMessage = message;
        } else {
          errorMessage = message;
        }
      }
      
      showError(errorTitle, errorMessage);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007e3a" />
        <Text>Loading rooms...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.body}>
        <Text style={styles.title}>🏢 Available Rooms</Text>

          <FlatList
            data={rooms}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-around" }}
            contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => openModal(item.name)}
              >
                <View style={styles.roomIconContainer}>
                  <FontAwesome5 name="door-open" size={20} color="#007e3a" />
                </View>
                <Text style={styles.roomName}>{item.name}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <FontAwesome5 name="building" size={48} color="#ccc" />
                <Text style={styles.empty}>No rooms available</Text>
              </View>
            }
          />

        {/* Modal Form */}
        <Modal
          isVisible={isModalVisible}
          onBackdropPress={closeModal}
          useNativeDriver
          hideModalContentWhileAnimating
        >
          <View style={styles.modal}>
            <View style={styles.modalBubbles}>
              <View style={styles.modalBubble1} />
              <View style={styles.modalBubble2} />
              <View style={styles.modalBubble3} />
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeModal}
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Room Booking Request</Text>
            <Text style={styles.roomDisplay}>{selectedRoom}</Text>


            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                value={fullName}
                placeholder=" Full Name"
                style={styles.input}
                onChangeText={setFullName}
              />
              <TextInput
                value={idNumber}
                placeholder="ID Number"
                style={styles.input}
                onChangeText={setIdNumber}
              />

              {/* Year Picker */}
              <View style={styles.input}>
                <Picker
                  selectedValue={year}
                  onValueChange={(val) => setYear(val)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Year Level" value="" />
                  {YEAR_OPTIONS.map((opt) => (
                    <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                  ))}
                </Picker>
              </View>

              {/* Department Picker */}
              <View style={styles.input}>
                <Picker
                  selectedValue={department}
                  onValueChange={(val) => {
                    setDepartment(val);
                    setCourse("");
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Department" value="" />
                  {DEPT_OPTIONS.map((opt) => (
                    <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                  ))}
                </Picker>
              </View>

              {/* Course Picker */}
              <View style={styles.input}>
                <Picker
                  enabled={!!department}
                  selectedValue={course}
                  onValueChange={(val) => setCourse(val)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Course" value="" />
                  {department &&
                    COURSE_OPTIONS[department]?.map((opt) => (
                      <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                    ))}
                </Picker>
              </View>

              {/* Date */}
              <TouchableOpacity
                onPress={() => setShowPicker({ type: "date", visible: true })}
                style={styles.input}
              >
                <Text style={{ color: date ? "#000" : "#888" }}>
                  {date ? date.toDateString() : " Select Date"}
                </Text>
              </TouchableOpacity>

              {/* Time In */}
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowPicker({ type: "timeIn", visible: true })}
              >
                <Text style={{ color: timeIn ? "#000" : "#888" }}>
                  {timeIn
                    ? timeIn.toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : " Select Time In"}
                </Text>
              </TouchableOpacity>

              {/* Time Out */}
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowPicker({ type: "timeOut", visible: true })}
              >
                <Text style={{ color: timeOut ? "#000" : "#888" }}>
                  {timeOut
                    ? timeOut.toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : " Select Time Out"}
                </Text>
              </TouchableOpacity>

              {/* Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={closeModal}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}> Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* Native Pickers */}
        {showPicker.visible && showPicker.type === "date" && (
          <DateTimePicker
            mode="date"
            value={date ?? new Date()}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleDateChange}
          />
        )}
        {showPicker.visible &&
          (showPicker.type === "timeIn" || showPicker.type === "timeOut") && (
            <DateTimePicker
              mode="time"
              value={new Date()}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleTimeChange(showPicker.type as "timeIn" | "timeOut")}
            />
          )}
      </View>
      <Footer />
      
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
    backgroundColor: "#bbe0cd",
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    margin: 15,
    color: "#007e3a",
  },
  item: {
    backgroundColor: "#fff",
    padding: 10,
    margin: 5,
    width: (width - 40) / 2,
    minHeight: 80,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  roomIconContainer: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: "rgba(0, 126, 58, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  roomName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 6,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  empty: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  modal: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  modalBubbles: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  modalBubble1: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 126, 58, 0.1)',
    top: 20,
    right: 20,
  },
  modalBubble2: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 166, 81, 0.15)',
    top: 80,
    left: 30,
  },
  modalBubble3: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    top: 150,
    right: 40,
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
  },
  closeText: {
    fontSize: 24,
    color: "#333",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 20,
    textAlign: "center",
    color: "#333",
    zIndex: 1,
  },
  roomDisplay: {
    textAlign: "center",
    marginVertical: 10,
    fontWeight: "600",
    color: "#007e3a",
    fontSize: 16,
    zIndex: 1,
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 50,
  },
  picker: {
    height: 55,
    color: "#333",
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#00a651",
    padding: 14,
    borderRadius: 25,
    alignItems: "center",
    marginRight: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 25,
    backgroundColor: "#ddd",
    alignItems: "center",
    marginLeft: 8,
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 15,
    fontWeight: "500",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
