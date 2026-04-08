import React, { useEffect } from "react";

import Purchases from "react-native-purchases";
import { useUserStore } from "./store/userStore";
import { syncEntitlements } from "./utils/syncEntitlements";

import AppNavigator from "./navigation/AppNavigator";

import Constants from "expo-constants";
import * as Updates from "expo-updates";

// ⭐ Notifications imports
import {
  requestNotificationPermissions,
  setupAndroidChannel,
  setupNotificationHandler,
} from "./utils/notifications";

// Debug logs
console.log("CHANNEL:", Updates.channel);
console.log("RUNTIME:", Updates.runtimeVersion);
console.log("🔧 EXTRA:", Constants.expoConfig?.extra);

// Global flag for RC readiness
declare global {
  var __RC_READY__: boolean | undefined;
}

export default function App() {
  // ⭐ HARD RESET store on every launch
  useEffect(() => {
    console.log("🧹 HARD RESET STORE");
    useUserStore.setState({
      entitlementsLoaded: false,
      userTier: "free",
      isFree: true,
      isPremiumMonthly: false,
      isPremiumAnnual: false,
      isPro: false,
      hasSeenOnboarding: false,
    });
  }, []);

  // ⭐ RevenueCat init
  useEffect(() => {
    async function initRC() {
      try {
        console.log("🔵 RC INIT START");

        Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);

        Purchases.configure({
          apiKey: "goog_tdDNBytofaDfyxtxrUhZcyCXdPX",
        });

        console.log("🟢 RC READY");
        globalThis.__RC_READY__ = true;
      } catch (err) {
        console.log("🔴 RC INIT ERROR:", err);
      }
    }

    initRC();
  }, []);

  // ⭐ Load entitlements AFTER RC is ready
  useEffect(() => {
    async function loadEntitlements() {
      console.log("⏳ WAITING FOR RC READY...");
      while (!globalThis.__RC_READY__) {
        console.log("⏳ STILL WAITING...");
        await new Promise((res) => setTimeout(res, 50));
      }

      console.log("🟢 RC READY → LOADING ENTITLEMENTS");

      // Small delay for Android stability
      await new Promise((res) => setTimeout(res, 200));

      await syncEntitlements();

      console.log("✅ ENTITLEMENTS LOADED");
    }

    loadEntitlements();
  }, []);

  // ⭐ Notifications setup (ΠΡΟΣΤΕΘΗΚΕ)
  useEffect(() => {
    requestNotificationPermissions();
    setupNotificationHandler();
    setupAndroidChannel();
  }, []);

  return <AppNavigator />;
}