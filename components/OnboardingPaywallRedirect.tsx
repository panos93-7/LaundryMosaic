import { LinearGradient } from "expo-linear-gradient";
import { Text, TouchableOpacity } from "react-native";
import { useUserStore } from "../store/userStore";

export default function OnboardingPaywallRedirect({ navigation }: any) {
  const setHasSeenOnboarding = useUserStore((s) => s.setHasSeenOnboarding);

  function finish() {
    setHasSeenOnboarding(true);
    navigation.navigate("Paywall");
  }

  function skip() {
    setHasSeenOnboarding(true);
    navigation.navigate("Home");
  }

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
        You're All Set
      </Text>

      <Text
        style={{
          fontSize: 18,
          color: "#ccc",
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        Unlock the full AI experience with Premium or Pro.
      </Text>

      <TouchableOpacity
        onPress={finish}
        style={{
          backgroundColor: "#fff",
          paddingVertical: 14,
          borderRadius: 14,
          marginBottom: 20,
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

      <TouchableOpacity onPress={skip}>
        <Text
          style={{
            textAlign: "center",
            color: "#aaa",
            textDecorationLine: "underline",
          }}
        >
          Skip for now
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}