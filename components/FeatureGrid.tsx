import { useNavigation } from "@react-navigation/native";
import { View } from "react-native";
import { Events } from "../analytics/events";
import { useUserStore } from "../store/userStore";
import { FeatureButton } from "./FeatureButton";

export function FeatureGrid({ isDarkMode }: any) {
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
    navigation.navigate(screen);
  };

  return (
    <View style={{ width: "100%", marginTop: 30 }}>

      {/* AI SMART SCAN — PREMIUM */}
      <FeatureButton
        title="AI Smart Scan"
        icon="🔍"
        large
        badgeType="Premium"
        isDarkMode={isDarkMode}
        userTier={userTier}   // ⭐ FIX
        onPress={() =>
          handleFeaturePress("ai_smart_scan", "SmartScan", true)
        }
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
            title="Batch Scan"
            icon="🧺"
            badgeType="Pro"
            isDarkMode={isDarkMode}
            userTier={userTier}   // ⭐ FIX
            onPress={() =>
              handleFeaturePress("batch_scan", "BatchScan", true)
            }
          />
        </View>

        <View style={{ width: "48%" }}>
          <FeatureButton
            title="Smart Wardrobe"
            icon="👕"
            badgeType="Pro"
            isDarkMode={isDarkMode}
            userTier={userTier}   // ⭐ FIX
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
            title="Planner"
            icon="📅"
            badgeType={null}
            isDarkMode={isDarkMode}
            userTier={userTier}   // ⭐ FIX
            onPress={() =>
              handleFeaturePress("planner", "Planner", false)
            }
          />
        </View>

        <View style={{ width: "48%" }}>
          <FeatureButton
            title="Custom Fabrics"
            icon="🧵"
            badgeType="Pro"
            isDarkMode={isDarkMode}
            userTier={userTier}   // ⭐ FIX
            onPress={() =>
              handleFeaturePress("custom_fabrics", "CustomFabrics", true)
            }
          />
        </View>
      </View>
    </View>
  );
}