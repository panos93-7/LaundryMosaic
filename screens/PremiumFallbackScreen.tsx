import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Purchases from "react-native-purchases";
import { SafeAreaView } from "react-native-safe-area-context";
import { syncEntitlements } from "../utils/syncEntitlements";

export default function PremiumFallbackScreen({ navigation }: any) {
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
        <Text style={{ color: "#fff", marginTop: 10 }}>Loading offer...</Text>
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

  // ⭐ ONLY Premium Annual
  const premiumAnnual = offerings?.availablePackages?.find(
    (p: any) => p.identifier === "premium_annual"
  );

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
            marginBottom: 8,
          }}
        >
          Smart Wash Premium
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: "#bbb",
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          A lighter plan with the essentials you need.
        </Text>

        {/* PREMIUM ANNUAL CARD */}
        {premiumAnnual && (
          <LinearGradient
            colors={["#6a11cb", "#2575fc"]}
            style={{
              borderRadius: 24,
              padding: 26,
              marginBottom: 28,
              shadowColor: "#000",
              shadowOpacity: 0.3,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 26,
                fontWeight: "800",
                marginBottom: 6,
              }}
            >
              Premium Annual
            </Text>

            <Text style={{ color: "#fff", opacity: 0.85, marginBottom: 16 }}>
              Save more with our best yearly price.
            </Text>

            <Text
              style={{
                color: "#fff",
                fontSize: 34,
                fontWeight: "800",
                marginBottom: 20,
              }}
            >
              {premiumAnnual?.product?.priceString ?? "—"}
              <Text style={{ fontSize: 16, opacity: 0.7 }}>/year</Text>
            </Text>

            <TouchableOpacity
              onPress={() => handlePurchase(premiumAnnual)}
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                paddingVertical: 14,
                borderRadius: 14,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                Upgrade Now
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

        {/* BENEFITS */}
        <View style={{ marginBottom: 32 }}>
          {[
            "Auto‑Add to Planner",
            "Full Wash History",
            "AI stain removal",
            "Premium themes",
            "Faster processing",
          ].map((b, i) => (
            <Text
              key={i}
              style={{
                color: "#ccc",
                fontSize: 16,
                marginBottom: 8,
              }}
            >
              • {b}
            </Text>
          ))}
        </View>

        {/* CONTINUE FREE */}
        <TouchableOpacity onPress={() => navigation.replace("Home")}>
          <Text
            style={{
              textAlign: "center",
              color: "#aaa",
              textDecorationLine: "underline",
              marginBottom: 20,
              fontSize: 16,
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