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
import { syncEntitlements } from "../utils/syncEntitlements";

export default function PaywallScreen({ navigation }: any) {
  const [offerings, setOfferings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        <Text style={{ color: "#fff", marginTop: 10 }}>Loading...</Text>
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
        <Text style={{ color: "#fff" }}>No offerings found.</Text>
      </SafeAreaView>
    );
  }

  // ⭐ PRO PACKAGES
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

      // ⭐ Sync entitlements after purchase
      await syncEntitlements();

      navigation.replace("Home");
    } catch (e) {
      console.log("Purchase error:", e);
    }
  }

  async function handleRestore() {
    try {
      await Purchases.restorePurchases();

      // ⭐ Sync entitlements after restore
      await syncEntitlements();

      navigation.replace("Home");
    } catch (e) {
      console.log("Restore error:", e);
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
          Unlock Laundry Pro+
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: "#ccc",
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          Get unlimited AI features, batch scanning, wardrobe & more.
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
              Pro Monthly
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
              Pro Annual (Best Value)
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
              Pro Lifetime Access
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
              Upgrade to Pro+
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* CONTINUE FREE */}
        <TouchableOpacity onPress={() => navigation.replace("PremiumFallback")}>
          <Text
            style={{
              textAlign: "center",
              color: "#aaa",
              textDecorationLine: "underline",
              marginBottom: 20,
            }}
          >
            Continue with Free version
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
            Restore Purchases
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}