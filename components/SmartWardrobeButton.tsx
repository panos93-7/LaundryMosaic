import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { isFeatureAvailable } from "../utils/featureLock";
import { withUpsell } from "../utils/withUpsell";
import { PremiumLockIndicator } from "./PremiumLockIndicator";

type UserTier = "free" | "premium_monthly" | "premium_annual" | "pro";

type Props = {
  userTier: UserTier;
};

export default function SmartWardrobeButton({ userTier }: Props) {
  const navigation = useNavigation<any>();

  const locked = !isFeatureAvailable("smartWardrobe", userTier);

  function handlePress() {
    withUpsell("smartWardrobe", userTier, navigation, () => {
      navigation.navigate("SmartWardrobe");
    });
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.button,
        { opacity: locked ? 0.5 : 1 },
      ]}
    >
      <View style={styles.content}>
        {locked && <PremiumLockIndicator />}
        <Text style={styles.text}>Smart Wardrobe</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#e5e5ea", // matches your light theme
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 14,

    // premium iOS shadow
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    color: "#1c1c1e",
    fontSize: 17,
    fontWeight: "600",
  },
});