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
// ⭐ RESTORE ENTITLEMENTS (FIXED)
// ---------------------------------------------------------
export async function restoreEntitlements() {
  console.log("🔵 RESTORE ENTITLEMENTS START");

  try {
    const info = await Purchases.getCustomerInfo();

    console.log("🟢 CustomerInfo:", info);
    console.log("🟢 Active entitlements:", info.entitlements.active);
    console.log("🟢 Active subs:", info.activeSubscriptions);

    const ent = info.entitlements.active || {};

    // ⭐ PRO (lifetime or subscription)
    if (ent["Pro"]) {
      console.log("🏆 SET TIER → PRO");
      useUserStore.getState().setFromEntitlement("pro");
    }

    // ⭐ PREMIUM (monthly or annual)
    else if (ent["Premium"]) {
      const productId =
        ent["Premium"].productIdentifier?.toLowerCase() || "";

      const isAnnual =
        productId.includes("annual") ||
        productId.includes("year") ||
        productId.includes("yr");

      console.log(
        "🏆 SET TIER → PREMIUM",
        isAnnual ? "ANNUAL" : "MONTHLY"
      );

      useUserStore
        .getState()
        .setFromEntitlement(isAnnual ? "premium_annual" : "premium_monthly");
    }

    // ⭐ FREE
    else {
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