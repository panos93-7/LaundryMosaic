import { LinearGradient } from "expo-linear-gradient";
import { Text, TouchableOpacity, View } from "react-native";

export default function OnboardingValue({ navigation }: any) {
  return (
    <LinearGradient
      colors={["#0d0d0d", "#1a1a1a"]}
      style={{ flex: 1, justifyContent: "center", padding: 30 }}
    >
      <Text
        style={{
          fontSize: 32,
          fontWeight: "800",
          color: "#fff",
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        Powerful AI Features
      </Text>

      <View style={{ marginBottom: 40 }}>
        <Text style={{ color: "#ccc", fontSize: 18, marginBottom: 12 }}>
          • AI stain detection
        </Text>
        <Text style={{ color: "#ccc", fontSize: 18, marginBottom: 12 }}>
          • Smart wardrobe organization
        </Text>
        <Text style={{ color: "#ccc", fontSize: 18, marginBottom: 12 }}>
          • Batch scanning & presets
        </Text>
        <Text style={{ color: "#ccc", fontSize: 18 }}>
          • Personalized laundry planner
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate("OnboardingPersonalization")}
        style={{
          backgroundColor: "#fff",
          paddingVertical: 14,
          borderRadius: 14,
        }}
      >
        <Text
          style={{
            textAlign: "center",
            fontWeight: "700",
            fontSize: 18,
            color: "#000",
          }}
        >
          Continue
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}