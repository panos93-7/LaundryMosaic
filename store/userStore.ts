import Purchases from "react-native-purchases";
import { create } from "zustand";

export type Tier =
  | "free"
  | "premium_monthly"
  | "premium_annual"
  | "pro";

type UserStore = {
  // --- REAL STATE (from RevenueCat) ---
  userTier: Tier;

  // Derived booleans
  isFree: boolean;
  isPremiumMonthly: boolean;
  isPremiumAnnual: boolean;
  isPro: boolean;

  // Sync from entitlements
  setFromEntitlement: (tier: Tier) => void;

  // --- ENTITLEMENT LOADING FLAG ---
  entitlementsLoaded: boolean;
  setEntitlementsLoaded: (v: boolean) => void;

  // --- ONBOARDING ---
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (v: boolean) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  // -----------------------------
  // REAL STATE (RevenueCat)
  // -----------------------------
  userTier: "free",

  // Derived flags
  isFree: true,
  isPremiumMonthly: false,
  isPremiumAnnual: false,
  isPro: false,

  // -----------------------------
  // SET ENTITLEMENT
  // -----------------------------
  setFromEntitlement: (tier) => {
    set({
      userTier: tier,

      isFree: tier === "free",
      isPremiumMonthly: tier === "premium_monthly",
      isPremiumAnnual: tier === "premium_annual",
      isPro: tier === "pro",
    });
  },

  // -----------------------------
  // ENTITLEMENT LOADING FLAG
  // -----------------------------
  entitlementsLoaded: false,
  setEntitlementsLoaded: (v) => set({ entitlementsLoaded: v }),

  // -----------------------------
  // ONBOARDING
  // -----------------------------
  hasSeenOnboarding: false,
  setHasSeenOnboarding: (v) => set({ hasSeenOnboarding: v }),
}));

// ---------------------------------------------------------
// ⭐ RESTORE ENTITLEMENTS
// ---------------------------------------------------------
export async function restoreEntitlements() {
  console.log("🔵 RESTORE ENTITLEMENTS START");

  try {
    const info = await Purchases.getCustomerInfo();

    console.log("🟢 CustomerInfo:", info);
    console.log("🟢 Active entitlements:", info.entitlements.active);
    console.log("🟢 Active subs:", info.activeSubscriptions);

    const hasPro = info.entitlements.active["pro"];
    const hasPremiumMonthly = info.entitlements.active["premium_monthly"];
    const hasPremiumAnnual = info.entitlements.active["premium_annual"];

    if (hasPro) {
      console.log("🏆 SET TIER → PRO");
      useUserStore.getState().setFromEntitlement("pro");
    } else if (hasPremiumAnnual) {
      console.log("🏆 SET TIER → PREMIUM ANNUAL");
      useUserStore.getState().setFromEntitlement("premium_annual");
    } else if (hasPremiumMonthly) {
      console.log("🏆 SET TIER → PREMIUM MONTHLY");
      useUserStore.getState().setFromEntitlement("premium_monthly");
    } else {
      console.log("🏆 SET TIER → FREE");
      useUserStore.getState().setFromEntitlement("free");
    }

    useUserStore.getState().setEntitlementsLoaded(true);
    console.log("🟣 ENTITLEMENTS LOADED = TRUE");

  } catch (err) {
    console.log("❌ Failed to restore entitlements:", err);

    useUserStore.getState().setFromEntitlement("free");
    useUserStore.getState().setEntitlementsLoaded(true);

    console.log("🟣 ENTITLEMENTS LOADED = TRUE (ERROR)");
  }
}