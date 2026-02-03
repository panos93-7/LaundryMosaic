import { useNavigation } from "@react-navigation/native";
import React from "react";
import { TouchableOpacity } from "react-native";
import { useUserStore } from "../store/userStore";
import { isFeatureAvailable } from "../utils/featureLock";
import { shouldShowPremiumFallback } from "../utils/PaywallLogic";

type Props = {
  feature: string;
  children: React.ReactNode;
};

export default function FeatureLock({ feature, children }: Props) {
  const navigation = useNavigation<any>();
  const userTier = useUserStore((s) => s.userTier);

  async function handlePress() {
    const available = isFeatureAvailable(feature, userTier);

    if (available) {
      return;
    }

    const showPremium = await shouldShowPremiumFallback();

    if (showPremium) {
      navigation.navigate("PremiumFallback");
    } else {
      navigation.navigate("Paywall");
    }
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      {children}
    </TouchableOpacity>
  );
}