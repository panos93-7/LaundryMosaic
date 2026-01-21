import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

export function PremiumLockIndicator() {
  return (
    <View style={{ position: "absolute", top: 8, right: 8, zIndex: 10 }}>
      <Ionicons name="lock-closed" size={18} color="#fff" />
    </View>
  );
}