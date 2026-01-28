import React, { useEffect } from "react";

import Purchases from "react-native-purchases";
import { syncEntitlements } from "./utils/syncEntitlements";

import { Events } from "./analytics/events";
import AppNavigator from "./navigation/AppNavigator";
import {
  getDaysSinceInstall,
  getSessionNumber,
  incrementSessions,
  initInstallDate,
} from "./utils/PaywallLogic";

import Constants from "expo-constants";
import * as Updates from "expo-updates";

// Debug logs
console.log("CHANNEL:", Updates.channel);
console.log("RUNTIME:", Updates.runtimeVersion);
console.log("🔧 EXTRA:", Constants.expoConfig?.extra);

// ⭐ Declare global flag so TS stops complaining
declare global {
  var __RC_READY__: boolean | undefined;
}

export default function App() {
  // ⭐ RevenueCat init — ΜΟΝΟ ΜΙΑ ΦΟΡΑ
  useEffect(() => {
    async function initRC() {
      try {
        Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);

        Purchases.configure({
          apiKey: "goog_tdDNBytofaDfyxtxrUhZcyCXdPX",
        });

        await Purchases.logIn("tester_panos");

        // ⭐ VERY IMPORTANT — σηματοδοτεί ότι το RC είναι έτοιμο
        globalThis.__RC_READY__ = true;
      } catch (err) {
        console.log("RevenueCat init error:", err);
      }
    }

    initRC();
  }, []);

  // ⭐ Load entitlements ΜΟΝΟ όταν το RC είναι έτοιμο
  useEffect(() => {
    async function loadEntitlements() {
      // wait until RC is configured
      while (!globalThis.__RC_READY__) {
        await new Promise((res) => setTimeout(res, 50));
      }

      // μικρό delay για Android
      await new Promise((res) => setTimeout(res, 200));

      await syncEntitlements();
    }

    loadEntitlements();
  }, []);

  // ⭐ Analytics + session tracking
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

  // ⭐ OTA updates (background)
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
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // ⭐ Το AppNavigator χειρίζεται το cinematic splash
  return <AppNavigator />;
}