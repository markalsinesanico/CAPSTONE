// screens/Screen.tsx
import React, { useEffect, useState } from "react";
import type { JSX } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  ImageBackground,
  Dimensions,
  Animated,
} from "react-native";
import { useImmersiveMode } from "../src/useImmersiveMode";
import Modal from "react-native-modal";
import DateTimePicker from "@react-native-community/datetimepicker";
import { FontAwesome } from "@expo/vector-icons";
import Header from "../navigation/Header";
import Footer from "../navigation/Footer";
import { Picker } from "@react-native-picker/picker";
import API from "../src/api";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// ----------- Interfaces / Types ----------
interface Item {
  id: number;
  name: string;
  qty: number;
  description: string | null;
  image_url: string | null;
}

type FormState = {
  fullName: string;
  idNumber: string;
  year: string;
  dept: string;
  course: string;
  date: Date | null;
  timeIn: Date | null;
  timeOut: Date | null;
};

type TimePickerState = {
  field: "timeIn" | "timeOut" | null;
  visible: boolean;
};

// ----------- Options ----------
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
    { label: "BSECE", value: "BSECE" },
    { label: "BSEE", value: "BSEE" },
    { label: "BSCoE", value: "BSCoE" },
    { label: "BSIS", value: "BSIS" },
    { label: "BSInfoTech", value: "BSInfoTech" },
    { label: "BSCS", value: "BSCS" },
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
    { label: "BEET", value: "BEET" },
    { label: "BEXET", value: "BEXET" },
    { label: "BMET", value: "BMET" },
    { label: "BMET-MT", value: "BMET-MT" },
    { label: "BMET-RAC", value: "BMET-RAC" },
    { label: "BSIT-ADT", value: "BSIT-ADT" },
    { label: "BSIT-AT", value: "BSIT-AT" },
    { label: "BSIT-ELT", value: "BSIT-ELT" },
    { label: "BSIT-ET", value: "BSIT-ET" },
    { label: "BSIT-MT", value: "BSIT-MT" },
    { label: "BSIT-WAF", value: "BSIT-WAF" },
    { label: "BSIT-HVACR", value: "BSIT-HVACR" },
  ],
  CAS: [
    { label: "BSES", value: "BSES" },
    { label: "BSMATH", value: "BSMATH" },
    { label: "BA-EL", value: "BA-EL" },
  ],
};

// ----------- Screen ----------
export default function Screen(): JSX.Element {
  const [search, setSearch] = useState<string>("");
  const [isModalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedItemName, setSelectedItemName] = useState<string>("");
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({
    fullName: "",
    idNumber: "",
    year: "",
    dept: "",
    course: "",
    date: null,
    timeIn: null,
    timeOut: null,
  });
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<TimePickerState>({
    field: null,
    visible: false,
  });

  // API items
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);


  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await API.get("/items");
      setItems(response.data);
    } catch (error: any) {
      console.error("Error fetching items:", error.message);
      Alert.alert("Error", "Unable to load items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useImmersiveMode();

  const openRequest = (item: Item) => {
    setSelectedItemName(item.name);
    setSelectedItemId(item.id);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const handleFormChange = <K extends keyof FormState>(
    key: K,
    val: FormState[K]
  ) => {
    setForm((s) => ({ ...s, [key]: val }));
  };

  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) handleFormChange("date", selectedDate);
  };

  const onTimeChange =
    (field: "timeIn" | "timeOut") =>
    (_: any, selectedDate?: Date) => {
      setShowTimePicker({ field: null, visible: false });
      if (selectedDate) handleFormChange(field, selectedDate);
    };

  const submit = async () => {
    try {
      if (!selectedItemId) {
        Alert.alert("Error", "Please select an item");
        return;
      }

      // Get user email from storage
      const userEmail = await AsyncStorage.getItem('email');

      const formatTime = (date: Date) =>
        date.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        });

      const requestData = {
        name: form.fullName,
        borrower_id: form.idNumber,
        year: form.year,
        department: form.dept,
        course: form.course,
        date: form.date?.toISOString().split("T")[0],
        time_in: form.timeIn ? formatTime(form.timeIn) : "",
        time_out: form.timeOut ? formatTime(form.timeOut) : "",
        item_id: selectedItemId,
        email: userEmail || "", // Include user email, default to empty string
      };

      console.log('Sending request data:', requestData);

      await API.post("/requests", requestData);

      Alert.alert("Success", "Request submitted successfully!");
      setModalVisible(false);
      resetForm();
    } catch (error: any) {
      console.error("Error submitting request:", error);
      Alert.alert("Error", "Failed to submit request. Please try again.");
    }
  };

  const resetForm = () => {
    setForm({
      fullName: "",
      idNumber: "",
      year: "",
      dept: "",
      course: "",
      date: null,
      timeIn: null,
      timeOut: null,
    });
    setSelectedItemId(null);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007e3a" />
        <Text>Loading items...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <View style={styles.backgroundBubbles}>
        <View style={styles.bubble1} />
        <View style={styles.bubble2} />
        <View style={styles.bubble3} />
        <View style={styles.bubble4} />
        <View style={styles.bubble5} />
        <View style={styles.bubble6} />
      </View>

          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <TextInput
                placeholder="🔍 Search items..."
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholderTextColor="#666"
              />
            </View>
            <TouchableOpacity 
              style={styles.bellContainer}
              onPress={() => Alert.alert('Notifications', 'Notification feature coming soon!')}
            >
              <FontAwesome name="bell" size={20} color="#007e3a" />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>📦 Available Items</Text>

          <FlatList
            data={items.filter((i) =>
              i.name.toLowerCase().includes(search.toLowerCase())
            )}
            keyExtractor={(i) => i.id.toString()}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => (
              <View style={styles.item}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                ) : (
                  <View style={[styles.itemImage, styles.noImage]}>
                    <FontAwesome name="image" size={24} color="#ccc" />
                  </View>
                )}
                <View style={styles.itemContent}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.itemDescription}>{item.description}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={styles.itemButton}
                  onPress={() => openRequest(item)}
                >
                  <Text style={styles.itemButtonText}>Request</Text>
                </TouchableOpacity>
              </View>
            )}
          />

      {/* Modal */}
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
            style={styles.closeBtn}
            onPress={closeModal}
          >
            <FontAwesome name="times" size={22} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Borrowing Request Form</Text>
          <Text style={styles.selectedItem}>{selectedItemName}</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <TextInput
              value={form.fullName}
              placeholder=" Full Name"
              style={styles.input}
              onChangeText={(t) => handleFormChange("fullName", t)}
            />
            <TextInput
              value={form.idNumber}
              placeholder="School i.d"
              style={styles.input}
              onChangeText={(t) => handleFormChange("idNumber", t)}
            />

            {/* Year Picker */}
            <View style={styles.input}>
              <Picker
                selectedValue={form.year}
                onValueChange={(v) => handleFormChange("year", v)}
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
                selectedValue={form.dept}
                onValueChange={(v) => {
                  handleFormChange("dept", v);
                  handleFormChange("course", "");
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
                enabled={!!form.dept}
                selectedValue={form.course}
                onValueChange={(v) => handleFormChange("course", v)}
                style={styles.picker}
              >
                <Picker.Item label="Select Course" value="" />
                {form.dept &&
                  COURSE_OPTIONS[form.dept]?.map((opt) => (
                    <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                  ))}
              </Picker>
            </View>

            {/* Date */}
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={styles.input}
            >
              <Text style={{ color: form.date ? "#000" : "#888" }}>
                {form.date ? form.date.toDateString() : " Select Date"}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={form.date ?? new Date()}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}

            {/* Time In */}
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowTimePicker({ field: "timeIn", visible: true })}
            >
              <Text style={{ color: form.timeIn ? "#000" : "#888" }}>
                {form.timeIn
                  ? form.timeIn.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : " Select Time In"}
              </Text>
            </TouchableOpacity>

            {/* Time Out */}
            <TouchableOpacity
              style={styles.input}
              onPress={() =>
                setShowTimePicker({ field: "timeOut", visible: true })
              }
            >
              <Text style={{ color: form.timeOut ? "#000" : "#888" }}>
                {form.timeOut
                  ? form.timeOut.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : " Select Time Out"}
              </Text>
            </TouchableOpacity>

            {showTimePicker.visible && showTimePicker.field && (
              <DateTimePicker
                value={
                  (showTimePicker.field === "timeIn"
                    ? form.timeIn
                    : form.timeOut) ?? new Date()
                }
                mode="time"
                display="default"
                onChange={onTimeChange(showTimePicker.field)}
              />
            )}

            {/* Buttons */}
            <View style={styles.submitRow}>
              <TouchableOpacity style={styles.submitBtn} onPress={submit}>
                <Text style={styles.submitBtnText}>Submit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={closeModal}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}> Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Footer />
    </SafeAreaView>
  );
}

// ----------- Styles ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef7f2",
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
  searchSection: {
    margin: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 1,
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    fontSize: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  bellContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    marginHorizontal: 15,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: "700",
    color: "#007e3a",
    zIndex: 1,
  },
  item: {
    backgroundColor: "white",
    marginHorizontal: 15,
    marginVertical: 6,
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
    zIndex: 1,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    resizeMode: "cover",
  },
  noImage: {
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },
  itemDescription: {
    fontSize: 10,
    color: "#666",
    lineHeight: 14,
  },
  itemButton: {
    backgroundColor: "#007e3a",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  itemButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
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
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 20,
    textAlign: "center",
    color: "#333",
    zIndex: 1,
  },
  selectedItem: {
    textAlign: "center",
    marginVertical: 10,
    fontWeight: "600",
    color: "#007e3a",
    fontSize: 16,
    zIndex: 1,
  },
 label: {
  fontWeight: "600",
  color: "#007e3a",
  fontSize: 16,
  marginBottom: 6,
  flexWrap: "wrap",      // ✅ allow wrapping if text is long
  lineHeight: 22,        // ✅ better spacing between lines
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
  fontSize: 16,          // ✅ text more readable
  lineHeight: 22,        // ✅ prevent clipping inside
  minHeight: 50,         // ✅ avoid text cutoff
},

picker: {
  height: 55,            // ✅ taller picker to display full text
  color: "#333",
  fontSize: 16,
},

  submitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  submitBtn: {
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
  submitBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 25,
    backgroundColor: "#ddd",
    alignItems: "center",
    marginLeft: 8,
  },
  cancelBtnText: {
    color: "#333",
    fontSize: 15,
    fontWeight: "500",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
