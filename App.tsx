import React, { useEffect, useState } from "react";

import { Events } from "./analytics/events";
import AppNavigator from "./navigation/AppNavigator";
import {
  getDaysSinceInstall,
  getSessionNumber,
  incrementSessions,
  initInstallDate,
} from "./utils/PaywallLogic";

import Purchases from "react-native-purchases";
import { markPurchasesConfigured, syncEntitlements } from "./utils/syncEntitlements";

import Constants from "expo-constants";
import * as Updates from "expo-updates";

import { CustomSplash } from "./components/CustomSplash";

// Debug logs
console.log("CHANNEL:", Updates.channel);
console.log("RUNTIME:", Updates.runtimeVersion);
console.log("🔑 EXPO KEY:", Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY);
console.log("🔧 EXTRA:", Constants.expoConfig?.extra);
console.log("📦 FULL CONFIG:", Constants.expoConfig);

// RevenueCat init
try {
  Purchases.configure({
    apiKey: "goog_tdDNBytofaDfyxtxrUhZcyCXdPX",
  });
  markPurchasesConfigured();
} catch (err) {
  console.log("RevenueCat init error:", err);
}

export default function App() {
  const [loadingEntitlements, setLoadingEntitlements] = useState(true);

  // ⭐ Load entitlements BEFORE showing the app
  useEffect(() => {
    async function loadEntitlements() {
      try {
        await syncEntitlements();
      } finally {
        setLoadingEntitlements(false);
      }
    }
    loadEntitlements();
  }, []);

  // ⭐ Session tracking + analytics
  useEffect(() => {
    const run = async () => {
      try {
        await initInstallDate();
        await incrementSessions();

        const sessionNumber = await getSessionNumber();
        const daysSinceInstall = await getDaysSinceInstall();

        Events.appOpened();
        Events.sessionStart(sessionNumber, daysSinceInstall);
      } catch (err) {
        console.log("Session tracking error:", err);
      }
    };

    run();
  }, []);

  // ⭐ OTA update check — runs in background AFTER app loads
  useEffect(() => {
    const timer = setTimeout(() => {
      async function checkForOTA() {
        try {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
          }
        } catch (err) {
          console.log("OTA check failed:", err);
        }
      }

      checkForOTA();
    }, 3000); // Run 3 seconds after app loads

    return () => clearTimeout(timer);
  }, []);

  // ⭐ NEW: Cinematic Splash while loading entitlements
  if (loadingEntitlements) {
    return <CustomSplash />;
  }

  return <AppNavigator />;
}