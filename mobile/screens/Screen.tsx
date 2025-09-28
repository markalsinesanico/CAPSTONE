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
} from "react-native";
import { useImmersiveMode } from "../src/useImmersiveMode";
import Modal from "react-native-modal";
import DateTimePicker from "@react-native-community/datetimepicker";
import { FontAwesome } from "@expo/vector-icons";
import Header from "../navigation/Header";
import Footer from "../navigation/Footer";
import { Picker } from "@react-native-picker/picker";
import API from "../src/api";

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
        time_in: form.timeIn ? formatTime(form.timeIn) : null,
        time_out: form.timeOut ? formatTime(form.timeOut) : null,
        item_id: selectedItemId,
      };

      await API.post("/requests", requestData);

      Alert.alert("Success", "Request submitted successfully!");
      setModalVisible(false);
      resetForm();
    } catch (error: any) {
      Alert.alert("Error", "Failed to submit request.");
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

      <View style={styles.searchSection}>
        <TextInput
          placeholder="🔍 Search items..."
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
        <FontAwesome name="bell" size={24} color="white" style={styles.bellIcon} />
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
                <Text style={{ color: "#888" }}>No Image</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemAvailable}>Available</Text>
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
        onBackdropPress={() => setModalVisible(false)}
        useNativeDriver
        hideModalContentWhileAnimating
      >
        <View style={styles.modal}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setModalVisible(false)}
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
              placeholder="ID Number"
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
                onPress={() => setModalVisible(false)}
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
  },
  searchSection: {
    margin: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    fontSize: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  bellIcon: {
    marginLeft: 15,
  },
  sectionTitle: {
    marginHorizontal: 15,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: "700",
    color: "#007e3a",
  },
  item: {
    backgroundColor: "white",
    marginHorizontal: 15,
    marginVertical: 7,
    padding: 15,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  itemImage: {
    width: 65,
    height: 65,
    borderRadius: 10,
    marginRight: 12,
    resizeMode: "cover",
  },
  noImage: {
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 3,
  },
  itemAvailable: {
    fontSize: 12,
    color: "green",
    fontWeight: "500",
  },
  itemDescription: {
    fontSize: 11,
    color: "#555",
    marginTop: 3,
  },
  itemButton: {
    backgroundColor: "#00a651",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  itemButtonText: {
    color: "white",
    fontSize: 13,
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
  },
  selectedItem: {
    textAlign: "center",
    marginVertical: 10,
    fontWeight: "600",
    color: "#007e3a",
    fontSize: 16,
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
