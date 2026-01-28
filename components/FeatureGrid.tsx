import { useNavigation } from "@react-navigation/native";
import { View } from "react-native";
import { Events } from "../analytics/events";
import i18n from "../i18n";
import { useUserStore } from "../store/userStore";
import { FeatureButton } from "./FeatureButton";

export function FeatureGrid({ isDarkMode, language }: any) {
  const navigation = useNavigation<any>();
  const userTier = useUserStore((s) => s.userTier);
  const isPremiumUser = userTier !== "free";

  const handleFeaturePress = (
    featureName: string,
    screen: string,
    premiumOnly: boolean
  ) => {
    Events.homeFeatureTap(featureName);

    if (premiumOnly && !isPremiumUser) {
      Events.featureLockedTap(featureName, userTier);
      navigation.navigate("Paywall");
      return;
    }

    Events.featureUnlockedEntry(featureName, userTier);
    navigation.navigate(screen, { language });
  };

  return (
    <View style={{ width: "100%", marginTop: 30 }}>

      {/* AI SMART SCAN — PREMIUM */}
      <FeatureButton
        title={i18n.t("features.aiSmartScan")}
        icon="🔍"
        large
        badgeType="Premium"
        isDarkMode={isDarkMode}
        userTier={userTier}
       onPress={() => {
  if (userTier === "free" || userTier === "premium_monthly") {
    navigation.navigate("PremiumMonthlyPaywall");
    return;
  }

  navigation.navigate("SmartScan", { language });
}}
      />

      {/* ROW 1 */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 20,
        }}
      >
        <View style={{ width: "48%" }}>
          <FeatureButton
            title={i18n.t("features.batchScan")}
            icon="🧺"
            badgeType="Pro"
            isDarkMode={isDarkMode}
            userTier={userTier}
            onPress={() =>
              handleFeaturePress("batch_scan", "BatchScan", true)
            }
          />
        </View>

        <View style={{ width: "48%" }}>
          <FeatureButton
            title={i18n.t("features.smartWardrobe")}
            icon="👕"
            badgeType="Pro"
            isDarkMode={isDarkMode}
            userTier={userTier}
            onPress={() =>
              handleFeaturePress("smart_wardrobe", "Wardrobe", true)
            }
          />
        </View>
      </View>

      {/* ROW 2 */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 10,
        }}
      >
        <View style={{ width: "48%" }}>
          <FeatureButton
            title={i18n.t("features.planner")}
            icon="📅"
            badgeType={null}
            isDarkMode={isDarkMode}
            userTier={userTier}
            onPress={() =>
              handleFeaturePress("planner", "Planner", false)
            }
          />
        </View>

        <View style={{ width: "48%" }}>
          <FeatureButton
            title={i18n.t("features.customFabrics")}
            icon="🧵"
            badgeType="Pro"
            isDarkMode={isDarkMode}
            userTier={userTier}
            onPress={() =>
              handleFeaturePress("custom_fabrics", "CustomFabrics", true)
            }
          />
        </View>
      </View>
    </View>
  );
}