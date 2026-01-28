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
import { syncEntitlements } from "../utils/syncEntitlements";

export default function PremiumMonthlyPaywall({ navigation, route }: any) {
  const [offerings, setOfferings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const source = route?.params?.source ?? "premium_feature";

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
          {String(i18n.t("premiumMonthly.loading"))}
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
          {String(i18n.t("premiumMonthly.noOfferings"))}
        </Text>
      </SafeAreaView>
    );
  }

  const premiumMonthly = offerings.availablePackages?.find(
    (p: any) => p.identifier === "premium_monthly"
  );

  async function handlePurchase() {
    try {
      await Purchases.purchasePackage(premiumMonthly);
      await syncEntitlements();
      navigation.goBack();
    } catch (e) {
      console.log("Purchase error:", e);
    }
  }

  async function handleRestore() {
    try {
      await Purchases.restorePurchases();
      await syncEntitlements();
      navigation.goBack();
    } catch (e) {
      console.log("Restore error:", e);
    }
  }

  const message =
    source === "history"
      ? String(i18n.t("premiumMonthly.msgHistory"))
      : source === "autoAdd"
      ? String(i18n.t("premiumMonthly.msgAutoAdd"))
      : String(i18n.t("premiumMonthly.msgDefault"));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0d0d0d" }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>

        {/* HEADER */}
        <Text
          style={{
            fontSize: 32,
            fontWeight: "800",
            color: "#fff",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {String(i18n.t("premiumMonthly.title"))}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: "#bbb",
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          {message}
        </Text>

        {/* PREMIUM MONTHLY CARD */}
        <LinearGradient
          colors={["#2575fc", "#6a11cb"]}
          style={{
            borderRadius: 20,
            padding: 24,
            marginBottom: 28,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 24,
              fontWeight: "800",
              marginBottom: 6,
            }}
          >
            {String(i18n.t("premiumMonthly.monthlyTitle"))}
          </Text>

          <Text style={{ color: "#fff", opacity: 0.85, marginBottom: 16 }}>
            {String(i18n.t("premiumMonthly.monthlySubtitle"))}
          </Text>

          <Text
            style={{
              color: "#fff",
              fontSize: 32,
              fontWeight: "800",
              marginBottom: 20,
            }}
          >
            {premiumMonthly?.product?.priceString ?? "—"}
          </Text>

          <TouchableOpacity
            onPress={handlePurchase}
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
              {String(i18n.t("premiumMonthly.upgradeNow"))}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* CONTINUE FREE */}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text
            style={{
              textAlign: "center",
              color: "#aaa",
              textDecorationLine: "underline",
              marginBottom: 20,
              fontSize: 16,
            }}
          >
            {String(i18n.t("premiumMonthly.continueFree"))}
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
            {String(i18n.t("premiumMonthly.restore"))}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}