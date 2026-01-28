import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import i18n from "../i18n";
import { useUserStore } from "../store/userStore";

export default function HistoryScreen({ navigation }: any) {
  const isPremium = useUserStore(
    (s) => s.isPremiumMonthly || s.isPremiumAnnual || s.isPro
  );

  const [history, setHistory] = useState<any[]>([]);

  // Premium gate
  useEffect(() => {
    if (!isPremium) {
      navigation.replace("PremiumMonthlyPaywall", { source: "history" });
    }
  }, [isPremium]);

  if (!isPremium) return null;

  // Load wash history
  useEffect(() => {
    if (!isPremium) return;

    async function load() {
      try {
        const saved = await AsyncStorage.getItem("PLANS");

        if (saved) {
          const parsed = JSON.parse(saved);

          const sorted = parsed.sort((a: any, b: any) => {
            const da = new Date(a.year, a.month, a.day).getTime();
            const db = new Date(b.year, b.month, b.day).getTime();
            return db - da;
          });

          setHistory(sorted);
        } else {
          setHistory([]);
        }
      } catch (err) {
        console.log("Failed to load history", err);
      }
    }

    load();
  }, [isPremium]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0d0d0d" }}>
      <View style={{ flex: 1, padding: 24 }}>

        {/* HEADER */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 32,
              fontWeight: "800",
              flexShrink: 1,
              marginRight: 10,
            }}
            numberOfLines={2}
          >
            {String(i18n.t("history.title"))}
          </Text>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: "#4f9cff", fontSize: 16 }}>
              {String(i18n.t("history.close"))}
            </Text>
          </TouchableOpacity>
        </View>

        {/* EMPTY STATE */}
        {history.length === 0 && (
          <View
            style={{
              marginTop: 60,
              padding: 24,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.05)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#ccc", fontSize: 16 }}>
              {String(i18n.t("history.emptyTitle"))}
            </Text>
          </View>
        )}

        {/* HISTORY LIST */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {history.map((item, index) => {
            const dateLabel = `${item.day}/${item.month + 1}/${item.year}`;

            return (
              <View
                key={index}
                style={{
                  padding: 18,
                  borderRadius: 16,
                  backgroundColor: "#141414",
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: "#222",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: "700",
                    marginBottom: 4,
                  }}
                >
                  {item.title}
                </Text>

                <Text style={{ color: "#bbb" }}>{item.time}</Text>

                <Text style={{ color: "#888", marginTop: 6 }}>
                  {item.type} {String(i18n.t("history.typeLabel"))}
                </Text>

                <Text
                  style={{
                    color: "#4f9cff",
                    marginTop: 10,
                    fontSize: 14,
                  }}
                >
                  {dateLabel}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}