import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

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
  const [updating, setUpdating] = useState(false);

  // ⭐ Auto‑OTA update check
  useEffect(() => {
    async function checkForOTA() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          setUpdating(true);
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (err) {
        console.log("OTA check failed:", err);
      }
    }

    checkForOTA();
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

  // ⭐ Updating overlay
  if (updating) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0f0c29",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#fff" />
        <Text
          style={{
            color: "#fff",
            marginTop: 20,
            fontSize: 18,
            fontWeight: "600",
          }}
        >
          Updating app…
        </Text>
      </View>
    );
  }

  return <AppNavigator />;
}