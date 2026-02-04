import React, { useEffect } from "react";

import Purchases from "react-native-purchases";
import { useUserStore } from "./store/userStore";
import { syncEntitlements } from "./utils/syncEntitlements";

import AppNavigator from "./navigation/AppNavigator";

import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Updates from "expo-updates";

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

  // ⭐ TEMPORARY: CLEAR OLD STAIN TIPS CACHE (V1)
  useEffect(() => {
    async function clearOldStainTips() {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const stainKeys = keys.filter((k) => k.startsWith("stainTips:"));
        if (stainKeys.length > 0) {
          await AsyncStorage.multiRemove(stainKeys);
          console.log("🧽 Cleared old stainTips cache!");
        } else {
          console.log("🧽 No old stainTips cache found.");
        }
      } catch (err) {
        console.log("❌ Failed to clear stainTips cache:", err);
      }
    }

    clearOldStainTips();
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

  return <AppNavigator />;
}