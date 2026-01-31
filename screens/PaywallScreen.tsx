import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity
} from "react-native";
import Purchases from "react-native-purchases";
import { SafeAreaView } from "react-native-safe-area-context";
import i18n from "../i18n";
import { useUserStore } from "../store/userStore"; // ⭐ ADDED
import { syncEntitlements } from "../utils/syncEntitlements";

export default function PaywallScreen({ navigation }: any) {
  const [offerings, setOfferings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ⭐ Zustand selectors
  const isFree = useUserStore((s) => s.isFree);
  const isPremiumAnnual = useUserStore((s) => s.isPremiumAnnual);
  const isPremiumMonthly = useUserStore((s) => s.isPremiumMonthly);

  useEffect(() => {
    async function load() {
      try {
        const data = await Purchases.getOfferings();
        setOfferings(data.current);
      } catch (e) {
        console.log("Error loading offerings:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0d0d0d",
        }}
      >
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: "#fff", marginTop: 10 }}>
          {String(i18n.t("paywall.loading"))}
        </Text>
      </SafeAreaView>
    );
  }

  if (!offerings) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0d0d0d",
        }}
      >
        <Text style={{ color: "#fff" }}>
          {String(i18n.t("paywall.noOfferings"))}
        </Text>
      </SafeAreaView>
    );
  }

  const proMonthly = offerings.availablePackages?.find(
    (p: any) => p.identifier === "pro_monthly"
  );
  const proAnnual = offerings.availablePackages?.find(
    (p: any) => p.identifier === "pro_annual"
  );
  const proLifetime = offerings.availablePackages?.find(
    (p: any) => p.identifier === "pro_lifetime"
  );

  async function handlePurchase(pkg: any) {
    try {
      await Purchases.purchasePackage(pkg);
      await syncEntitlements();
      navigation.replace("Home");
    } catch (e) {
      console.log("Purchase error:", e);
    }
  }

  async function handleRestore() {
    try {
      await Purchases.restorePurchases();
      await syncEntitlements();
      navigation.replace("Home");
    } catch (e) {
      console.log("Restore error:", e);
    }
  }

  // ⭐ Correct Continue Free logic
  function handleContinueFree() {
    if (isPremiumAnnual || isPremiumMonthly) {
      navigation.replace("Home"); // ⭐ Premium user → Home
    } else {
      navigation.replace("PremiumFallback"); // ⭐ Free user → Fallback
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0d0d0d" }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>

        {/* HEADER */}
        <Text
          style={{
            fontSize: 34,
            fontWeight: "800",
            color: "#fff",
            textAlign: "center",
            marginBottom: 6,
          }}
        >
          {String(i18n.t("paywall.headerTitle"))}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: "#ccc",
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          {String(i18n.t("paywall.headerSubtitle"))}
        </Text>

        {/* PRO MONTHLY */}
        {proMonthly && (
          <TouchableOpacity
            onPress={() => handlePurchase(proMonthly)}
            style={{
              backgroundColor: "#141414",
              padding: 18,
              borderRadius: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: "#333",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
              {String(i18n.t("paywall.monthly"))}
            </Text>
            <Text style={{ color: "#bbb", marginTop: 4, fontSize: 16 }}>
              {proMonthly.product.priceString}
            </Text>
          </TouchableOpacity>
        )}

        {/* PRO ANNUAL */}
        {proAnnual && (
          <TouchableOpacity
            onPress={() => handlePurchase(proAnnual)}
            style={{
              backgroundColor: "#141414",
              padding: 18,
              borderRadius: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: "#333",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
              {String(i18n.t("paywall.annual"))}
            </Text>
            <Text style={{ color: "#bbb", marginTop: 4, fontSize: 16 }}>
              {proAnnual.product.priceString}
            </Text>
          </TouchableOpacity>
        )}

        {/* PRO LIFETIME */}
        {proLifetime && (
          <TouchableOpacity
            onPress={() => handlePurchase(proLifetime)}
            style={{
              backgroundColor: "#141414",
              padding: 18,
              borderRadius: 16,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: "#333",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
              {String(i18n.t("paywall.lifetime"))}
            </Text>
            <Text style={{ color: "#bbb", marginTop: 4, fontSize: 16 }}>
              {proLifetime.product.priceString}
            </Text>
          </TouchableOpacity>
        )}

        {/* CTA BUTTON */}
        <TouchableOpacity onPress={() => handlePurchase(proAnnual)}>
          <LinearGradient
            colors={["#ff8c00", "#ff5e00"]}
            style={{
              borderRadius: 20,
              padding: 18,
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 22,
                fontWeight: "800",
                textAlign: "center",
              }}
            >
              {String(i18n.t("paywall.upgradeButton"))}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* CONTINUE FREE */}
        <TouchableOpacity onPress={handleContinueFree}>
          <Text
            style={{
              textAlign: "center",
              color: "#aaa",
              textDecorationLine: "underline",
              marginBottom: 20,
            }}
          >
            {String(i18n.t("paywall.continueFree"))}
          </Text>
        </TouchableOpacity>

        {/* RESTORE */}
        <TouchableOpacity onPress={handleRestore}>
          <Text
            style={{
              textAlign: "center",
              color: "#777",
              fontSize: 14,
            }}
          >
            {String(i18n.t("paywall.restore"))}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}