import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { useLanguageStore } from "../store/languageStore";

export function GarmentCard({ item, onPress }: any) {
  const locale = useLanguageStore((s) => s.language);

  // Always prefer translated profile if locale matches
  const profile =
    item?.profile?.__locale === locale
      ? item.profile
      : item.original ?? {};

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
      {/* IMAGE */}
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
      <Text
        style={{
          color: "#fff",
          fontSize: 16,
          fontWeight: "600",
        }}
        numberOfLines={1}
      >
        {profile.name || "—"}
      </Text>

      {/* SUBTITLE — ALWAYS TRANSLATED */}
      <Text
        style={{
          color: "#aaa",
          fontSize: 13,
          marginTop: 2,
        }}
        numberOfLines={1}
      >
        {profile.type || "—"}
      </Text>
    </TouchableOpacity>
  );
}