console.log("FEATURE LOCK UTILS LOADED");
import { SUBSCRIPTIONS } from "../constants/subscriptions";

type UserTier =
  | "free"
  | "premium_monthly"
  | "premium_annual"
  | "pro";

export function isFeatureAvailable(feature: string, userTier: UserTier) {
  // Map monthly/annual to "premium"
  const normalizedTier =
    userTier === "premium_monthly" || userTier === "premium_annual"
      ? "premium"
      : userTier;

  const tier = SUBSCRIPTIONS[normalizedTier];

  if (!tier) return false;

  // Premium & Pro have full access
  if (normalizedTier === "premium" || normalizedTier === "pro") {
    return true;
  }

  // Free tier: check if feature exists in free.features
  return tier.features?.includes(feature) ?? false;
}