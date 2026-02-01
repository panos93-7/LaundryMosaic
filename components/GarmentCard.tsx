import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export function GarmentCard({ item, onPress }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: "48%",
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: 12,
        marginBottom: 14,
      }}
    >
      <View
        style={{
          height: 120,
          backgroundColor: "rgba(255,255,255,0.15)",
          borderRadius: 12,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={{ width: "100%", height: "100%", borderRadius: 12 }}
            resizeMode="cover"
          />
        ) : (
          <Text style={{ color: "#fff", fontSize: 40 }}>👕</Text>
        )}
      </View>

      {/* TITLE — ALWAYS TRANSLATED */}
      <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
        {item.profile?.name ?? item.original?.name}
      </Text>

      {/* SUBTITLE — ALWAYS TRANSLATED */}
      <Text style={{ color: "#aaa", fontSize: 13, marginTop: 2 }}>
        {item.profile?.type ?? item.original?.type}
      </Text>
    </TouchableOpacity>
  );
}