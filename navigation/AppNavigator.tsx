import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect } from "react";
import { AppState } from "react-native";

import { useUserStore } from "../store/userStore";
import { syncEntitlements } from "../utils/syncEntitlements";

// Onboarding
import OnboardingPaywallRedirect from "../components/OnboardingPaywallRedirect";
import OnboardingPersonalization from "../components/OnboardingPersonalization";
import OnboardingValue from "../components/OnboardingValue";
import OnboardingWelcome from "../components/OnboardingWelcome";

// Main Screens
import HistoryScreen from "../screens/HistoryScreen";
import HomeScreen from "../screens/HomeScreen";
import MonthCalendar from "../screens/MonthCalendar";
import PlannerScreen from "../screens/PlannerScreen";
import SmartScanScreen from "../screens/SmartScanScreen";

// Paywalls
import PaywallScreen from "../screens/PaywallScreen";
import PremiumFallbackScreen from "../screens/PremiumFallbackScreen";
import PremiumMonthlyPaywall from "../screens/PremiumMonthlyPaywall";

// PRO Screens
import BatchScanScreen from "../screens/BatchScanScreen";
import CustomFabricsScreen from "../screens/CustomFabricsScreen";
import WardrobeScreen from "../screens/SmartWardrobeScreen";

// Wardrobe Flow
import EditGarmentScreen from "../screens/EditGarmentScreen";
import GarmentDetailsScreen from "../screens/GarmentDetailsScreen";

// Fabric Details
import FabricDetailsScreen from "../screens/FabricDetailsScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const {
    hasSeenOnboarding,
    isPro,
    isPremiumAnnual,
    isPremiumMonthly,
    isFree,
    entitlementsLoaded,
  } = useUserStore();

  // ❗ Sync entitlements ONLY when app returns to foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        syncEntitlements();
      }
    });
    return () => sub.remove();
  }, []);

  // ---------------------------------------------------
  // ⭐ WAIT UNTIL ENTITLEMENTS ARE LOADED
  // ---------------------------------------------------
  if (!entitlementsLoaded) {
    return null; // αφήνουμε το cinematic splash να παίζει
  }

  // ---------------------------------------------------
  // ⭐ ONBOARDING FLOW
  // ---------------------------------------------------

  // PREMIUM USERS → ΠΟΤΕ onboarding
  if (isPro || isPremiumAnnual || isPremiumMonthly) {
    // skip onboarding entirely
  } else {
    // FREE USERS → onboarding only once
    if (!hasSeenOnboarding) {
      return (
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="OnboardingWelcome" component={OnboardingWelcome} />
            <Stack.Screen name="OnboardingValue" component={OnboardingValue} />
            <Stack.Screen
              name="OnboardingPersonalization"
              component={OnboardingPersonalization}
            />
            <Stack.Screen
              name="OnboardingPaywallRedirect"
              component={OnboardingPaywallRedirect}
            />
          </Stack.Navigator>
        </NavigationContainer>
      );
    }
  }

  // ---------------------------------------------------
  // ⭐ MAIN APP FLOW
  // ---------------------------------------------------
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>

        {/* GLOBAL PAYWALL SCREENS */}
        <Stack.Screen name="Paywall" component={PaywallScreen} />
        <Stack.Screen name="PremiumFallback" component={PremiumFallbackScreen} />
        <Stack.Screen
          name="PremiumMonthlyPaywall"
          component={PremiumMonthlyPaywall}
        />

        {/* PRO USERS */}
        {isPro && (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="SmartScan" component={SmartScanScreen} />
            <Stack.Screen name="Planner" component={PlannerScreen} />
            <Stack.Screen name="MonthCalendar" component={MonthCalendar} />
            <Stack.Screen name="History" component={HistoryScreen} />

            <Stack.Screen name="BatchScan" component={BatchScanScreen} />
            <Stack.Screen name="Wardrobe" component={WardrobeScreen} />
            <Stack.Screen name="CustomFabrics" component={CustomFabricsScreen} />

            <Stack.Screen name="GarmentDetails" component={GarmentDetailsScreen} />
            <Stack.Screen name="EditGarment" component={EditGarmentScreen} />

            <Stack.Screen name="FabricDetails" component={FabricDetailsScreen} />
          </>
        )}

        {/* PREMIUM ANNUAL */}
        {isPremiumAnnual && !isPro && (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="SmartScan" component={SmartScanScreen} />
            <Stack.Screen name="Planner" component={PlannerScreen} />
            <Stack.Screen name="MonthCalendar" component={MonthCalendar} />
            <Stack.Screen name="History" component={HistoryScreen} />

            <Stack.Screen name="FabricDetails" component={FabricDetailsScreen} />

            <Stack.Screen name="BatchScan" component={PaywallScreen} />
            <Stack.Screen name="Wardrobe" component={PaywallScreen} />
            <Stack.Screen name="CustomFabrics" component={PaywallScreen} />
            <Stack.Screen name="GarmentDetails" component={PaywallScreen} />
            <Stack.Screen name="EditGarment" component={PaywallScreen} />
          </>
        )}

        {/* PREMIUM MONTHLY */}
        {isPremiumMonthly && !isPro && !isPremiumAnnual && (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Planner" component={PlannerScreen} />
            <Stack.Screen name="MonthCalendar" component={MonthCalendar} />
            <Stack.Screen name="History" component={HistoryScreen} />

            <Stack.Screen name="SmartScan" component={PremiumFallbackScreen} />

            <Stack.Screen name="BatchScan" component={PaywallScreen} />
            <Stack.Screen name="Wardrobe" component={PaywallScreen} />
            <Stack.Screen name="CustomFabrics" component={PaywallScreen} />
            <Stack.Screen name="GarmentDetails" component={PaywallScreen} />
            <Stack.Screen name="EditGarment" component={PaywallScreen} />

            <Stack.Screen name="FabricDetails" component={PaywallScreen} />
          </>
        )}

        {/* FREE USERS */}
        {isFree && (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Planner" component={PlannerScreen} />
            <Stack.Screen name="MonthCalendar" component={MonthCalendar} />

            <Stack.Screen name="History" component={PremiumMonthlyPaywall} />
            <Stack.Screen name="SmartScan" component={PremiumFallbackScreen} />

            <Stack.Screen name="BatchScan" component={PaywallScreen} />
            <Stack.Screen name="Wardrobe" component={PaywallScreen} />
            <Stack.Screen name="CustomFabrics" component={PaywallScreen} />
            <Stack.Screen name="GarmentDetails" component={PaywallScreen} />
            <Stack.Screen name="EditGarment" component={PaywallScreen} />

            <Stack.Screen name="FabricDetails" component={PaywallScreen} />
          </>
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
}