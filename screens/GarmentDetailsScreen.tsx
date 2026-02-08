import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, Text, TextStyle, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import i18n from "../i18n";
import { useLanguageStore } from "../store/languageStore";
import { useWardrobeStore } from "../store/wardrobeStore";

// ⭐ Correct SmartWardrobe v3 imports
import { translateWardrobeProfile } from "../utils/AI/SmartWardrobe/translateWardrobeProfile";
import { translationCache } from "../utils/AI/SmartWardrobe/translationCache";

const styles: {
  sectionTitle: TextStyle;
  label: TextStyle;
  value: TextStyle;
} = {
  sectionTitle: {
    color: "#FFD479",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 30,
  },
  label: {
    color: "#AFCBFF",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 6,
  },
  value: {
    color: "#fff",
    fontSize: 18,
    marginTop: 4,
  },
};

export default function GarmentDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { id } = route.params;

  const garment: any = useWardrobeStore((s) =>
    s.garments.find((g) => g.id === id)
  );

  const updateGarment = useWardrobeStore((s) => s.updateGarment);
  const deleteGarment = useWardrobeStore((s) => s.deleteGarment);

  const locale = useLanguageStore((s) => s.language);

  const [isTranslating, setIsTranslating] = useState(false);

  // ⭐ LAZY TRANSLATION EFFECT (v3 clean)
  useEffect(() => {
    if (!garment) return;

    // 1. English → always original
    if (locale === "en") {
      updateGarment({
        id: garment.id,
        profile: { ...garment.original, __locale: "en" },
      });
      return;
    }

    // 2. Already translated → stop
    if (garment.profile?.__locale === locale) {
      return;
    }

    // 3. Prevent double calls
    if (isTranslating) return;

    async function run() {
      setIsTranslating(true);

      const translated = await translateWardrobeProfile(
        garment.original,
        locale,
        garment.id.toString(),
        translationCache
      );

      updateGarment({
        id: garment.id,
        profile: { ...translated, __locale: locale },
      });

      setIsTranslating(false);
    }

    run();
  }, [locale, garment?.id]);

  if (!garment) {
    return (
      <LinearGradient
        colors={["#0f0c29", "#302b63", "#24243e"]}
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Text style={{ color: "#fff" }}>Garment not found.</Text>
      </LinearGradient>
    );
  }

  // ⭐ Canonical fallback
  const profile: any = garment.profile ?? garment.original ?? {};

  const handleDelete = () => {
    deleteGarment(garment.id);
    navigation.goBack();
  };

  return (
    <LinearGradient colors={["#0f0c29", "#302b63", "#24243e"]} style={{ flex: 1 }}>
      {/* ⭐ LOTTIE OVERLAY */}
      {isTranslating && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 20,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <LottieView
            source={require("../translating.json")}
            autoPlay
            loop
            style={{ width: 160, height: 160 }}
          />
          <Text style={{ color: "#fff", marginTop: 10, fontSize: 18 }}>
            {String(i18n.t("garmentDetails.translating"))}…
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView>
          {/* BACK */}
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: "#ff6b6b", fontSize: 16 }}>
              ← {String(i18n.t("garmentDetails.back"))}
            </Text>
          </TouchableOpacity>

          {/* TITLE */}
          <Text
            style={{
              color: "#fff",
              fontSize: 30,
              fontWeight: "700",
              marginBottom: 20,
            }}
          >
            {profile?.name}
          </Text>

          {/* IMAGE */}
          {garment.image ? (
            <Image
              source={{ uri: garment.image }}
              style={{
                width: "100%",
                height: 260,
                borderRadius: 14,
                marginBottom: 20,
              }}
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: 260,
                borderRadius: 14,
                backgroundColor: "rgba(255,255,255,0.1)",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text style={{ color: "#fff" }}>
                {String(i18n.t("garmentDetails.noImage"))}
              </Text>
            </View>
          )}

          {/* BASIC INFO */}
          <View style={{ marginTop: 10 }}>
            <Text style={styles.label}>{i18n.t("garmentDetails.type")}</Text>
            <Text style={styles.value}>{profile.type}</Text>

            <Text style={styles.label}>{i18n.t("garmentDetails.color")}</Text>
            <Text style={styles.value}>{profile.color}</Text>

            <Text style={styles.label}>{i18n.t("garmentDetails.fabric")}</Text>
            <Text style={styles.value}>{profile.fabric}</Text>

            <Text style={styles.label}>{i18n.t("garmentDetails.pattern")}</Text>
            <Text style={styles.value}>{profile.pattern}</Text>

            <Text style={styles.label}>{i18n.t("garmentDetails.category")}</Text>
            <Text style={styles.value}>{profile.category}</Text>
          </View>

          {/* STAINS */}
          {(profile?.stains?.length ?? 0) > 0 && (
            <View>
              <Text style={styles.sectionTitle}>
                {i18n.t("garmentDetails.stainsDetected")}
              </Text>

              {profile.stains.map((stain: string, _index: number) => (
                <Text key={_index} style={styles.value}>• {stain}</Text>
              ))}
            </View>
          )}

          {/* RECOMMENDED PROGRAM */}
          {profile?.recommended && (
            <View>
              <Text style={styles.sectionTitle}>
                {i18n.t("garmentDetails.recommendedWashProgram")}
              </Text>

              <Text style={styles.label}>{i18n.t("garmentDetails.program")}</Text>
              <Text style={styles.value}>{profile.recommended.program}</Text>

              <Text style={styles.label}>{i18n.t("garmentDetails.temp")}</Text>
              <Text style={styles.value}>{profile.recommended.temp}°C</Text>

              <Text style={styles.label}>{i18n.t("garmentDetails.spin")}</Text>
              <Text style={styles.value}>{profile.recommended.spin} rpm</Text>

              <Text style={styles.label}>{i18n.t("garmentDetails.detergent")}</Text>
              <Text style={styles.value}>{profile.recommended.detergent}</Text>

              {profile.recommended.notes?.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.label}>{i18n.t("garmentDetails.notes")}</Text>
                  {profile.recommended.notes.map((note: string, _index: number) => (
                    <Text key={_index} style={styles.value}>• {note}</Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* CARE INSTRUCTIONS */}
          {profile?.care && (
            <View>
              <Text style={styles.sectionTitle}>
                {i18n.t("garmentDetails.careInstructions")}
              </Text>

              <Text style={styles.value}>{profile.care.wash}</Text>
              <Text style={styles.value}>{profile.care.bleach}</Text>
              <Text style={styles.value}>{profile.care.dry}</Text>
              <Text style={styles.value}>{profile.care.iron}</Text>
              <Text style={styles.value}>{profile.care.dryclean}</Text>

              {profile.care.warnings?.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.label}>{i18n.t("garmentDetails.warnings")}</Text>
                  {profile.care.warnings.map((warning: string, _index: number) => (
                    <Text key={_index} style={styles.value}>• {warning}</Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* RISKS */}
          {profile?.risks && (
            <View>
              <Text style={styles.sectionTitle}>
                {i18n.t("garmentDetails.risks")}
              </Text>

              <Text style={styles.label}>{i18n.t("garmentDetails.riskShrinkage")}</Text>
              <Text style={styles.value}>{profile.risks.shrinkage}</Text>

              <Text style={styles.label}>{i18n.t("garmentDetails.riskColorBleeding")}</Text>
              <Text style={styles.value}>{profile.risks.colorBleeding}</Text>

              <Text style={styles.label}>{i18n.t("garmentDetails.riskDelicacy")}</Text>
              <Text style={styles.value}>{profile.risks.delicacy}</Text>
            </View>
          )}

          {/* WASH FREQUENCY */}
          {profile?.washFrequency && (
            <View>
              <Text style={styles.sectionTitle}>
                {i18n.t("garmentDetails.washFrequency")}
              </Text>

              <Text style={styles.value}>{profile.washFrequency}</Text>
            </View>
          )}

          {/* CARE SYMBOLS */}
          {(profile?.careSymbols?.length ?? 0) > 0 && (
            <View>
              <Text style={styles.sectionTitle}>
                {i18n.t("garmentDetails.careSymbols")}
              </Text>

              {profile.careSymbols.map((symbol: string, _index: number) => (
                <Text key={_index} style={styles.value}>• {symbol}</Text>
              ))}
            </View>
          )}

          {/* EDIT BUTTON */}
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("EditGarment", {
                id: garment.id,
              })
            }
            style={{
              backgroundColor: "#2575fc",
              padding: 14,
              borderRadius: 12,
              marginTop: 30,
            }}
          >
            <Text
              style={{
                color: "#fff",
                textAlign: "center",
                fontSize: 18,
                fontWeight: "600",
              }}
            >
              {String(i18n.t("garmentDetails.editGarment"))}
            </Text>
          </TouchableOpacity>

          {/* DELETE BUTTON */}
          <TouchableOpacity
            onPress={handleDelete}
            style={{
              backgroundColor: "#ff6b6b",
              padding: 14,
              borderRadius: 12,
              marginTop: 14,
            }}
          >
            <Text
              style={{
                color: "#fff",
                textAlign: "center",
                fontSize: 18,
                fontWeight: "600",
              }}
            >
              {String(i18n.t("garmentDetails.deleteGarment"))}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ScrollView>
    </LinearGradient>
  );
}