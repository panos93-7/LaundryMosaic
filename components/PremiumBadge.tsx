import React from "react";
import { Text, View } from "react-native";

export function PremiumBadge() {
  return (
    <View
      style={{
        backgroundColor: "#ffd700",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ fontWeight: "700", fontSize: 12, color: "#000" }}>
        PREMIUM
      </Text>
    </View>
  );
}

export function ProBadge() {
  return (
    <View
      style={{
        backgroundColor: "#ff5e00",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ fontWeight: "700", fontSize: 12, color: "#fff" }}>
        PRO
      </Text>
    </View>
  );
}

