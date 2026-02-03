import { LinearGradient } from "expo-linear-gradient";
import { Text, TouchableOpacity } from "react-native";
import i18n from "../i18n";
import { useUserStore } from "../store/userStore";

export default function OnboardingPaywallRedirect({ navigation }: any) {
  const setHasSeenOnboarding = useUserStore((s) => s.setHasSeenOnboarding);

  function finish() {
    setHasSeenOnboarding(true);
    navigation.navigate("Paywall");
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
        {i18n.t("onboarding.finishTitle")}
      </Text>

      <Text
        style={{
          fontSize: 18,
          color: "#ccc",
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        {i18n.t("onboarding.finishSubtitle")}
      </Text>

      <TouchableOpacity
        onPress={finish}
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
          {i18n.t("onboarding.continue")}
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}