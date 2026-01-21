import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export function FabricCard({ item, onPress }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: "48%",
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: 14,
        marginBottom: 14,
      }}
    >
      <View
        style={{
          height: 80,
          backgroundColor: "rgba(255,255,255,0.15)",
          borderRadius: 12,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <Text style={{ fontSize: 40 }}>{item.icon || "🧵"}</Text>
      </View>

      <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
        {item.name}
      </Text>

      <Text style={{ color: "#aaa", fontSize: 13, marginTop: 2 }}>
        {item.description || "Custom fabric"}
      </Text>
    </TouchableOpacity>
  );
}