import { isFeatureAvailable } from "./featureLock";

type UserTier = "free" | "premium_monthly" | "premium_annual" | "pro";

export function withUpsell(
  feature: string,
  userTier: UserTier,
  navigation: any,
  onSuccess: () => void
): void {
  const available = isFeatureAvailable(feature, userTier);

  if (!available) {
    navigation.navigate("Paywall");
    return;
  }

  onSuccess();
}