import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export function FeatureButton({
  title,
  icon,
  onPress,
  badgeType = null,
  isDarkMode,
  large = false,
  userTier,
}: {
  title: string;
  icon: string;
  onPress: () => void;
  badgeType?: "Premium" | "Pro" | null;
  isDarkMode: boolean;
  large?: boolean;
  userTier: string;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{
        flex: large ? 1 : undefined,
        marginBottom: 14,
      }}
    >
      <LinearGradient
        colors={
          isDarkMode
            ? ["#8e2de2", "#4a00e0"] // DARK MODE stays the same
            : ["#e5e5ea", "#d4d4d8"] // ⭐ NEW LIGHT THEME COLORS
        }
        style={{
          padding: 2,
          borderRadius: large ? 18 : 14,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        }}
      >
        <View
          style={{
            backgroundColor: isDarkMode
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.05)",
            paddingVertical: large ? 22 : 14,
            paddingHorizontal: 18,
            borderRadius: large ? 16 : 12,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: large ? 22 : 16,
              fontWeight: "700",
              color: isDarkMode ? "#fff" : "#000",
              marginBottom: 4,
            }}
          >
            {icon} {title}
          </Text>

          {badgeType && (
            <Text
              style={{
                fontSize: 12,
                color: isDarkMode ? "#ffd700" : "#7a5f00",
                marginTop: 2,
              }}
            >
              ★ {badgeType}
            </Text>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}