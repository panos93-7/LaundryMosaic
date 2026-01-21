import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function AddFabricModal({ onClose, onSave }: any) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🧵");
  const [description, setDescription] = useState("");

  return (
    <LinearGradient
      colors={["#0f0c29", "#302b63", "#24243e"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1, padding: 20 }}>
        
        {/* HEADER */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 26, fontWeight: "700" }}>
            Add Fabric
          </Text>

          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: "#ff6b6b", fontSize: 16 }}>Close</Text>
          </TouchableOpacity>
        </View>

        {/* NAME */}
        <Text style={{ color: "#bbb", marginBottom: 6 }}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Silk Blend"
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

        {/* ICON */}
        <Text style={{ color: "#bbb", marginBottom: 6 }}>Icon</Text>
        <TextInput
          value={icon}
          onChangeText={setIcon}
          placeholder="e.g. 🧶"
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

        {/* DESCRIPTION */}
        <Text style={{ color: "#bbb", marginBottom: 6 }}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Optional"
          placeholderTextColor="#666"
          style={{
            backgroundColor: "#141414",
            color: "#fff",
            padding: 14,
            borderRadius: 12,
            marginBottom: 30,
            borderWidth: 1,
            borderColor: "#222",
          }}
        />

        {/* SAVE */}
        <TouchableOpacity
          onPress={() => {
            if (!name.trim()) return;
            onSave({ name, icon, description });
          }}
          style={{
            backgroundColor: "#2575fc",
            padding: 16,
            borderRadius: 14,
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
            Save Fabric
          </Text>
        </TouchableOpacity>

      </SafeAreaView>
    </LinearGradient>
  );
}