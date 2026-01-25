import React, { useEffect } from "react";
import { Events } from "./analytics/events";
import AppNavigator from "./navigation/AppNavigator";
import {
  getDaysSinceInstall,
  getSessionNumber,
  incrementSessions,
  initInstallDate,
} from "./utils/PaywallLogic";

import Purchases from "react-native-purchases";
import { markPurchasesConfigured } from "./utils/syncEntitlements";

import Constants from "expo-constants";
import * as Updates from "expo-updates";

console.log("CHANNEL:", Updates.channel);
console.log("RUNTIME:", Updates.runtimeVersion);

// 🔍 DEBUG LOGS ΓΙΑ ΤΟ PRODUCTION BUILD
console.log("🔑 EXPO KEY:", Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY);
console.log("🔧 EXTRA:", Constants.expoConfig?.extra);
console.log("📦 FULL CONFIG:", Constants.expoConfig);

// ⭐ Configure RevenueCat BEFORE the app renders
try {
  Purchases.configure({
    apiKey: "goog_tdDNBytofaDfyxtxrUhZcyCXdPX",
  });
  markPurchasesConfigured();
} catch (err) {
  console.log("RevenueCat init error:", err);
}

export default function App() {
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

  return <AppNavigator />;
}