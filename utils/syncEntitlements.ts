import Purchases from "react-native-purchases";
import { useUserStore } from "../store/userStore";

export async function syncEntitlements() {
  console.log("🔵 syncEntitlements START");

  try {
    const info = await Purchases.getCustomerInfo();
    console.log("🟢 CustomerInfo:", info);

    const ent = info?.entitlements?.active || {};
    const products = info?.activeSubscriptions || [];

    // PRO
    if (ent["Pro"]) {
      useUserStore.getState().setFromEntitlement("pro");
      useUserStore.getState().setEntitlementsLoaded(true);
      return;
    }

    // PREMIUM (annual or monthly)
    if (ent["Premium"]) {
      const isAnnual = products.some((p: string) =>
        p.toLowerCase().includes("annual")
      );

      useUserStore
        .getState()
        .setFromEntitlement(isAnnual ? "premium_annual" : "premium_monthly");

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