import { LinearGradient } from "expo-linear-gradient";
import { Text, TouchableOpacity } from "react-native";
import i18n from "../i18n";

export default function OnboardingWelcome({ navigation }: any) {
  return (
    <LinearGradient
      colors={["#0d0d0d", "#1a1a1a"]}
      style={{ flex: 1, justifyContent: "center", padding: 30 }}
    >
      <Text
        style={{
          fontSize: 36,
          fontWeight: "800",
          color: "#fff",
          textAlign: "center",
          marginBottom: 10,
        }}
      >
        {i18n.t("onboarding.welcomeTitle")}
      </Text>

      <Text
        style={{
          fontSize: 18,
          color: "#ccc",
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        {i18n.t("onboarding.welcomeSubtitle")}
      </Text>

      <TouchableOpacity
        onPress={() => navigation.navigate("OnboardingValue")}
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