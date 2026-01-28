import Purchases from "react-native-purchases";
import { useUserStore } from "../store/userStore";

// Track if configure() has run
let isConfigured = false;

export function markPurchasesConfigured() {
  isConfigured = true;
}

export async function syncEntitlements() {
  console.log("🔵 syncEntitlements START");

  try {
    if (!isConfigured) {
      console.log("🟡 SKIPPED: Purchases not configured");
      return;
    }

    const info = await Purchases.getCustomerInfo();
    console.log("🟢 CustomerInfo:", info);

    if (!info) {
      useUserStore.getState().setFromEntitlement("free");
      useUserStore.getState().setEntitlementsLoaded(true);
      return;
    }

    const ent = info.entitlements?.active || {};
    const products = info.activeSubscriptions || [];

    if (ent["Pro"]) {
      useUserStore.getState().setFromEntitlement("pro");
      useUserStore.getState().setEntitlementsLoaded(true);
      return;
    }

    if (ent["Premium"]) {
      const isAnnual = products.some((p: string) =>
        p.toLowerCase().includes("annual")
      );

      if (isAnnual) {
        useUserStore.getState().setFromEntitlement("premium_annual");
      } else {
        useUserStore.getState().setFromEntitlement("premium_monthly");
      }

      useUserStore.getState().setEntitlementsLoaded(true);
      return;
    }

    // FREE
    useUserStore.getState().setFromEntitlement("free");
    useUserStore.getState().setEntitlementsLoaded(true);

  } catch (e) {
    console.log("🔴 syncEntitlements ERROR:", e);

    useUserStore.getState().setFromEntitlement("free");
    useUserStore.getState().setEntitlementsLoaded(true);
  }
}