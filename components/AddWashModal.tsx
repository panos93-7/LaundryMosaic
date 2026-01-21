import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddWashModal({ onClose, onSave, initialData, selectedDay }: any) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [time, setTime] = useState(initialData?.time || "");
  const [type, setType] = useState(initialData?.type || "");

  const washTypes = ["Whites", "Colors", "Delicates", "Quick Wash"];

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setTime(initialData.time);
      setType(initialData.type);
    }
  }, [initialData]);

  function isPastDate() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selected = new Date(selectedDay.year, selectedDay.month, selectedDay.day);
    selected.setHours(0, 0, 0, 0);

    return selected < today;
  }

  function handleSave() {
    if (!title.trim()) {
      Alert.alert("Missing Title", "Please enter a title for the wash.");
      return;
    }

    if (!time.trim()) {
      Alert.alert("Missing Time", "Please enter a time.");
      return;
    }

    if (!type.trim()) {
      Alert.alert("Missing Type", "Please select a wash type.");
      return;
    }

    if (isPastDate()) {
      Alert.alert("Invalid Date", "You cannot schedule a wash in the past.");
      return;
    }

    onSave({ title, time, type });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0d0d0d" }} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          
          {/* HEADER */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 28, fontWeight: "700" }}>
              {initialData ? "Edit Wash" : "Add New Wash"}
            </Text>

            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: "#ff6b6b", fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
          </View>

          {/* TITLE */}
          <Text style={{ color: "#bbb", marginBottom: 6 }}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Whites Load"
            placeholderTextColor="#666"
            style={{
              backgroundColor: "#141414",
              color: "#fff",
              padding: 14,
              borderRadius: 12,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: "#222",
            }}
          />

          {/* TIME */}
          <Text style={{ color: "#bbb", marginBottom: 6 }}>Time</Text>
          <TextInput
            value={time}
            onChangeText={setTime}
            placeholder="e.g. 10:30"
            placeholderTextColor="#666"
            style={{
              backgroundColor: "#141414",
              color: "#fff",
              padding: 14,
              borderRadius: 12,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: "#222",
            }}
          />

          {/* WASH TYPE */}
          <Text style={{ color: "#bbb", marginBottom: 12 }}>Wash Type</Text>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 30,
            }}
          >
            {washTypes.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setType(t)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: type === t ? "#2575fc" : "#111",
                  borderWidth: 1,
                  borderColor: type === t ? "#2575fc" : "#222",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* SAVE BUTTON */}
          <TouchableOpacity onPress={handleSave}>
            <LinearGradient
              colors={["#6a11cb", "#2575fc"]}
              style={{
                padding: 16,
                borderRadius: 16,
                shadowColor: "#000",
                shadowOpacity: 0.3,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                {initialData ? "Save Changes" : "Save Wash"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}