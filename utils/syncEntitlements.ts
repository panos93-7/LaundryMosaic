// SAFE import for Expo Go (avoids native crash)
let Purchases: any;
if (__DEV__) {
  Purchases = {
    isConfigured: true,
    getCustomerInfo: async () => ({
      entitlements: { active: {} },
      activeSubscriptions: [],
    }),
  };
} else {
  Purchases = require("react-native-purchases").default;
}

// Track if configure() has run
let isConfigured = false;

export function markPurchasesConfigured() {
  isConfigured = true;
}

import { useUserStore } from "../store/userStore";

export async function syncEntitlements() {
  try {
    // ⭐ SAFETY CHECK — DO NOT CALL RevenueCat BEFORE configure()
    if (!isConfigured) {
      console.log("syncEntitlements skipped: Purchases not configured yet");
      return;
    }

    const info = await Purchases.getCustomerInfo();

    if (!info) {
      useUserStore.getState().setFromEntitlement("free");
      return;
    }

    const ent = info.entitlements?.active || {};
    const products = info.activeSubscriptions || [];

    // --- PRO ENTITLEMENT ---
    if (ent["Pro"]) {
      useUserStore.getState().setFromEntitlement("pro");
      return;
    }

    // --- PREMIUM ENTITLEMENT ---
    if (ent["Premium"]) {
      const isAnnual = products.some((p: string) =>
        p.toLowerCase().includes("annual")
      );

      if (isAnnual) {
        useUserStore.getState().setFromEntitlement("premium_annual");
      } else {
        useUserStore.getState().setFromEntitlement("premium_monthly");
      }

      return;
    }

    // --- FREE ---
    useUserStore.getState().setFromEntitlement("free");

  } catch (e) {
    console.log("Error syncing entitlements:", e);
    useUserStore.getState().setFromEntitlement("free");
  }
}