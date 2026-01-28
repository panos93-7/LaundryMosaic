import Purchases from "react-native-purchases";
import { useUserStore } from "../store/userStore";

export async function syncEntitlements() {
  console.log("🔵 syncEntitlements START");

  try {
    const info = await Purchases.getCustomerInfo();
    console.log("🟢 CustomerInfo:", info);

    const ent = info?.entitlements?.active || {};

    // ⭐ PRO (lifetime or subscription)
    if (ent["Pro"]) {
      console.log("🏆 SET TIER → PRO");
      useUserStore.getState().setFromEntitlement("pro");
      useUserStore.getState().setEntitlementsLoaded(true);
      return;
    }

    // ⭐ PREMIUM (monthly or annual)
    if (ent["Premium"]) {
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

      useUserStore.getState().setEntitlementsLoaded(true);
      return;
    }

    // ⭐ FREE
    console.log("🏆 SET TIER → FREE");
    useUserStore.getState().setFromEntitlement("free");
    useUserStore.getState().setEntitlementsLoaded(true);

  } catch (e) {
    console.log("🔴 syncEntitlements ERROR:", e);

    useUserStore.getState().setFromEntitlement("free");
    useUserStore.getState().setEntitlementsLoaded(true);
  }
}