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
import i18n from "../i18n";

export default function AddWashModal({ onClose, onSave, initialData, selectedDay }: any) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [time, setTime] = useState(initialData?.time || "");
  const [type, setType] = useState(initialData?.type || "");

  const washTypes = [
    { key: "whites", label: i18n.t("addWash.washTypes.whites") },
    { key: "colors", label: i18n.t("addWash.washTypes.colors") },
    { key: "delicates", label: i18n.t("addWash.washTypes.delicates") },
    { key: "quick", label: i18n.t("addWash.washTypes.quick") },
  ];

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
      Alert.alert(
        String(i18n.t("addWash.errorMissingTitle")),
        String(i18n.t("addWash.errorMissingTitleMsg"))
      );
      return;
    }

    if (!time.trim()) {
      Alert.alert(
        String(i18n.t("addWash.errorMissingTime")),
        String(i18n.t("addWash.errorMissingTimeMsg"))
      );
      return;
    }

    if (!type.trim()) {
      Alert.alert(
        String(i18n.t("addWash.errorMissingType")),
        String(i18n.t("addWash.errorMissingTypeMsg"))
      );
      return;
    }

    if (isPastDate()) {
      Alert.alert(
        String(i18n.t("addWash.errorInvalidDate")),
        String(i18n.t("addWash.errorInvalidDateMsg"))
      );
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
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 28, fontWeight: "700", flexShrink: 1 }}>
              {initialData
                ? String(i18n.t("addWash.editTitle"))
                : String(i18n.t("addWash.addTitle"))}
            </Text>

            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: "#ff6b6b", fontSize: 16 }}>
                {String(i18n.t("addWash.close"))}
              </Text>
            </TouchableOpacity>
          </View>

          {/* TITLE */}
          <Text style={{ color: "#bbb", marginBottom: 6 }}>
            {String(i18n.t("addWash.labelTitle"))}
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={String(i18n.t("addWash.placeholderTitle"))}
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
          <Text style={{ color: "#bbb", marginBottom: 6 }}>
            {String(i18n.t("addWash.labelTime"))}
          </Text>
          <TextInput
            value={time}
            onChangeText={setTime}
            placeholder={String(i18n.t("addWash.placeholderTime"))}
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
          <Text style={{ color: "#bbb", marginBottom: 12 }}>
            {String(i18n.t("addWash.labelType"))}
          </Text>

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
                key={t.key}
                onPress={() => setType(t.label)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: type === t.label ? "#2575fc" : "#111",
                  borderWidth: 1,
                  borderColor: type === t.label ? "#2575fc" : "#222",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>{t.label}</Text>
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
                {initialData
                  ? String(i18n.t("addWash.saveChanges"))
                  : String(i18n.t("addWash.saveWash"))}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}