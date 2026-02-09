// SmartWardrobeScreen.tsx — SmartWardrobe V3 (Batch Translation)

import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import React, { useEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { resolveLocale } from "../utils/AI/SmartWardrobe/resolveLocale";

import { GarmentCard } from "../components/GarmentCard";
import i18n from "../i18n";

import { useLanguageStore } from "../store/languageStore";
import { useWardrobeStore } from "../store/wardrobeStore";

// SmartWardrobe v3
import { translateWardrobeProfile } from "../utils/AI/SmartWardrobe/translateWardrobeProfile";
import { translationCache } from "../utils/AI/SmartWardrobe/translationCache";
import { wardrobePipeline } from "../utils/AI/SmartWardrobe/wardrobePipeline";

export default function WardrobeScreen() {
  const navigation = useNavigation<any>();

  const garments = useWardrobeStore((s) => s.garments);
  const addGarment = useWardrobeStore((s) => s.addGarment);
  const updateGarment = useWardrobeStore((s) => s.updateGarment);
  const deleteGarment = useWardrobeStore((s) => s.deleteGarment);
  const hydrate = useWardrobeStore((s) => s.hydrate);

  const [analyzing, setAnalyzing] = useState(false);
  const locale = useLanguageStore((s) => s.language);

  // Load wardrobe from storage
  useEffect(() => {
    hydrate();
  }, []);

  // Auto‑translate when locale changes (Batch Translation)
  useEffect(() => {
    async function translateAll() {
      if (garments.length === 0) return;

      const translatedProfiles = await Promise.all(
        garments.map(async (g) => {
          // English → no translation needed
          if (locale === "en") {
            return { ...g, profile: g.original };
          }

          // Check translation cache
          const cached = await translationCache.get(g.id.toString(), locale);
          if (cached) {
            return { ...g, profile: cached };
          }

          // Batch translate original canonical
          const translated = await translateWardrobeProfile(
            g.original,
            locale,
            g.id.toString(),
            translationCache
          );

          return { ...g, profile: translated };
        })
      );

      for (const updated of translatedProfiles) {
        updateGarment(updated);
      }
    }

    translateAll();
  }, [locale]);

  // Add garment flow
  const handleAddGarment = async () => {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.9,
    base64: true,
  });

  if (res.canceled) return;

  const uri = res.assets[0].uri;

  setAnalyzing(true);

  try {
    const rawLocale = (i18n as any).language;
    const locale = resolveLocale(rawLocale);
    console.log("🌍 ADD GARMENT rawLocale:", rawLocale, "resolved:", locale);

    const { original, profile } = await wardrobePipeline(uri, locale);

    await addGarment({
      id: Date.now(),
      original,
      profile,
      image: uri,
    });
  } catch (err) {
    console.log("❌ Wardrobe error:", err);
  }

  setAnalyzing(false);
};



  return (
    <LinearGradient
      colors={["#0f0c29", "#302b63", "#24243e"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1, padding: 20 }}>
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
              fontSize: 28,
              fontWeight: "700",
              flexShrink: 1,
              marginRight: 10,
            }}
            numberOfLines={2}
          >
            {String(i18n.t("wardrobe.title"))}
          </Text>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: "#ff6b6b", fontSize: 16 }}>
              {String(i18n.t("wardrobe.close"))}
            </Text>
          </TouchableOpacity>
        </View>

        {/* AI LOADING OVERLAY */}
        {analyzing && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.65)",
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 30,
              zIndex: 999,
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(15,12,41,0.9)",
                borderRadius: 20,
                paddingVertical: 24,
                paddingHorizontal: 20,
                alignItems: "center",
                width: "80%",
              }}
            >
              <LottieView
                source={require("../wardrobe-analyzing.json")}
                autoPlay
                loop
                style={{ width: 120, height: 120, marginBottom: 10 }}
              />

              <Text
                style={{
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: "600",
                  textAlign: "center",
                  marginBottom: 4,
                }}
              >
                {String(i18n.t("wardrobe.analyzing"))}
              </Text>

              <Text
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 14,
                  textAlign: "center",
                }}
              >
                {String(i18n.t("wardrobe.analyzingSubtitle"))}
              </Text>
            </View>
          </View>
        )}

        {/* EMPTY STATE */}
        {garments.length === 0 && !analyzing && (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 20,
            }}
          >
            <Text
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: 20,
                fontWeight: "600",
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              {String(i18n.t("wardrobe.emptyTitle"))}
            </Text>

            <Text
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 16,
                textAlign: "center",
                lineHeight: 22,
                marginBottom: 30,
              }}
            >
              {String(i18n.t("wardrobe.emptySubtitle"))}
            </Text>

            <TouchableOpacity
              onPress={handleAddGarment}
              style={{
                backgroundColor: "#2575fc",
                width: 70,
                height: 70,
                borderRadius: 35,
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#000",
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
                marginTop: 10,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 34, fontWeight: "700" }}>
                +
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* GRID VIEW */}
        {garments.length > 0 && (
          <>
            <FlatList
              data={garments}
              numColumns={2}
              keyExtractor={(item) => item.id.toString()}
              columnWrapperStyle={{ justifyContent: "space-between" }}
              renderItem={({ item }) => (
                <GarmentCard
                  item={item}
                  onPress={() =>
                    navigation.navigate("GarmentDetails", {
                      id: item.id,
                    })
                  }
                />
              )}
            />

            <TouchableOpacity
              onPress={handleAddGarment}
              style={{
                position: "absolute",
                bottom: 30,
                right: 30,
                backgroundColor: "#2575fc",
                width: 60,
                height: 60,
                borderRadius: 30,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 30 }}>+</Text>
            </TouchableOpacity>
          </>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}