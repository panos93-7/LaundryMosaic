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
  // ONBOARDING
  // -----------------------------
  hasSeenOnboarding: false,
  setHasSeenOnboarding: (v) => set({ hasSeenOnboarding: v }),
}));