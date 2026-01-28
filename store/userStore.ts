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
  try {
    const info = await Purchases.getCustomerInfo();

    const hasPro = info.entitlements.active["pro"];
    const hasPremiumMonthly = info.entitlements.active["premium_monthly"];
    const hasPremiumAnnual = info.entitlements.active["premium_annual"];

    if (hasPro) {
      useUserStore.getState().setFromEntitlement("pro");
    } else if (hasPremiumAnnual) {
      useUserStore.getState().setFromEntitlement("premium_annual");
    } else if (hasPremiumMonthly) {
      useUserStore.getState().setFromEntitlement("premium_monthly");
    } else {
      useUserStore.getState().setFromEntitlement("free");
    }

    // ⭐ ΜΟΝΟ ΕΔΩ — αφού έχουμε βάλει entitlement
    useUserStore.getState().setEntitlementsLoaded(true);

  } catch (err) {
    console.log("❌ Failed to restore entitlements:", err);

    useUserStore.getState().setFromEntitlement("free");

    // ⭐ ΑΚΟΜΑ ΚΑΙ ΣΤΟ ERROR → ΜΕΤΑ το setFromEntitlement
    useUserStore.getState().setEntitlementsLoaded(true);
  }
}