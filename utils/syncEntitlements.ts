import Purchases from "react-native-purchases";
import { useUserStore } from "../store/userStore";

// Track if configure() has run
let isConfigured = false;

export function markPurchasesConfigured() {
  isConfigured = true;
}

export async function syncEntitlements() {
  try {
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

    if (ent["Pro"]) {
      useUserStore.getState().setFromEntitlement("pro");
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

      return;
    }

    useUserStore.getState().setFromEntitlement("free");
  } catch (e) {
    console.log("Error syncing entitlements:", e);
    useUserStore.getState().setFromEntitlement("free");
  }
}