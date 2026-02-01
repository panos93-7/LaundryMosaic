import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import i18n from "../i18n";
import { useLanguageStore } from "../store/languageStore";
import { useWardrobeStore } from "../store/wardrobeStore";
import { translateGarmentProfile } from "../utils/AI/translateGarment";
import { translationCache } from "../utils/AI/translationCache";

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

  // ⭐ LAZY TRANSLATION EFFECT
  useEffect(() => {
    if (!garment) return;

    console.log("🔥 EFFECT TRIGGERED");
    console.log("locale =", locale);
    console.log("garment.profile.__locale =", garment?.profile?.__locale);

    // 1. English → always original
    if (locale === "en") {
      console.log("⛔ STOP: locale is EN, using original");
      updateGarment({
        id: garment.id,
        profile: { ...garment.original, __locale: "en" },
      });
      return;
    }

    // 2. Already translated → stop
    if (garment.profile?.__locale === locale) {
      console.log("⛔ STOP: already translated for this locale");
      return;
    }

    // 3. Prevent double calls
    if (isTranslating) {
      console.log("⛔ STOP: already translating");
      return;
    }

    async function run() {
      setIsTranslating(true);
      console.log("🚀 Translating now...");

      const translated = await translateGarmentProfile(
        garment.original,
        locale,
        garment.id.toString(),
        translationCache
      );

      console.log("✅ AI returned:", translated);

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

  const profile: any = garment.profile;

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
          <Text style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}>
            {String(i18n.t("garmentDetails.type"))}: {profile?.type}
          </Text>

          <Text style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}>
            {String(i18n.t("garmentDetails.color"))}: {profile?.color}
          </Text>

          <Text style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}>
            {String(i18n.t("garmentDetails.fabric"))}: {profile?.fabric}
          </Text>

          <Text style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}>
            {String(i18n.t("garmentDetails.pattern"))}: {profile?.pattern}
          </Text>

          <Text style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}>
            {String(i18n.t("garmentDetails.category"))}: {profile?.category}
          </Text>

          {/* STAINS */}
          {(profile?.stains?.length ?? 0) > 0 && (
            <View style={{ marginTop: 30 }}>
              <Text
                style={{
                  color: "#ff9f9f",
                  fontSize: 22,
                  fontWeight: "700",
                  marginBottom: 6,
                }}
              >
                {String(i18n.t("garmentDetails.stainsDetected"))}
              </Text>

              {profile.stains.map((s: string, i: number) => (
                <Text key={i} style={{ color: "#fff", marginTop: 4 }}>
                  • {s}
                </Text>
              ))}
            </View>
          )}

          {/* RECOMMENDED PROGRAM */}
          {profile?.recommended && (
            <View style={{ marginTop: 30 }}>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 22,
                  fontWeight: "700",
                  marginBottom: 6,
                }}
              >
                {String(i18n.t("garmentDetails.recommendedWashProgram"))}
              </Text>

              <Text style={{ color: "#fff", marginTop: 6 }}>
                {String(i18n.t("garmentDetails.program"))}:{" "}
                {profile.recommended.program}
              </Text>

              <Text style={{ color: "#fff", marginTop: 6 }}>
                {String(i18n.t("garmentDetails.temp"))}:{" "}
                {profile.recommended.temp}°C
              </Text>

              <Text style={{ color: "#fff", marginTop: 6 }}>
                {String(i18n.t("garmentDetails.spin"))}:{" "}
                {profile.recommended.spin} rpm
              </Text>

              <Text style={{ color: "#fff", marginTop: 6 }}>
                {String(i18n.t("garmentDetails.detergent"))}:{" "}
                {profile.recommended.detergent}
              </Text>

              {profile.recommended.notes?.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "700",
                      fontSize: 18,
                      marginBottom: 4,
                    }}
                  >
                    {String(i18n.t("garmentDetails.notes"))}:
                  </Text>

                  {profile.recommended.notes.map((n: string, i: number) => (
                    <Text key={i} style={{ color: "#fff", marginTop: 4 }}>
                      • {n}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* CARE INSTRUCTIONS */}
          {profile?.care && (
            <View style={{ marginTop: 30 }}>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 22,
                  fontWeight: "700",
                  marginBottom: 6,
                }}
              >
                {String(i18n.t("garmentDetails.careInstructions"))}
              </Text>

              <Text style={{ color: "#fff", marginTop: 6 }}>
                {profile.care.wash}
              </Text>
              <Text style={{ color: "#fff", marginTop: 6 }}>
                {profile.care.bleach}
              </Text>
              <Text style={{ color: "#fff", marginTop: 6 }}>
                {profile.care.dry}
              </Text>
              <Text style={{ color: "#fff", marginTop: 6 }}>
                {profile.care.iron}
              </Text>
              <Text style={{ color: "#fff", marginTop: 6 }}>
                {profile.care.dryclean}
              </Text>

              {profile.care.warnings?.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "700",
                      fontSize: 18,
                      marginBottom: 4,
                    }}
                  >
                    {String(i18n.t("garmentDetails.warnings"))}:
                  </Text>

                  {profile.care.warnings.map((w: string, i: number) => (
                    <Text key={i} style={{ color: "#fff", marginTop: 4 }}>
                      • {w}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* RISKS */}
          {profile?.risks && (
            <View style={{ marginTop: 30 }}>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 22,
                  fontWeight: "700",
                  marginBottom: 6,
                }}
              >
                {String(i18n.t("garmentDetails.risks"))}
              </Text>

              <Text style={{ color: "#fff", marginTop: 6 }}>
                {String(i18n.t("garmentDetails.riskShrinkage"))}:{" "}
                {profile.risks.shrinkage}
              </Text>

              <Text style={{ color: "#fff", marginTop: 6 }}>
                {String(i18n.t("garmentDetails.riskColorBleeding"))}:{" "}
                {profile.risks.colorBleeding}
              </Text>

              <Text style={{ color: "#fff", marginTop: 6 }}>
                {String(i18n.t("garmentDetails.riskDelicacy"))}:{" "}
                {profile.risks.delicacy}
              </Text>
            </View>
          )}

          {/* WASH FREQUENCY */}
          {profile?.washFrequency && (
            <View style={{ marginTop: 30 }}>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 22,
                  fontWeight: "700",
                  marginBottom: 6,
                }}
              >
                {String(i18n.t("garmentDetails.washFrequency"))}
              </Text>

              <Text style={{ color: "#fff", marginTop: 6 }}>
                {profile.washFrequency}
              </Text>
            </View>
          )}

          {/* CARE SYMBOLS */}
          {(profile?.careSymbols?.length ?? 0) > 0 && (
            <View style={{ marginTop: 30 }}>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 22,
                  fontWeight: "700",
                  marginBottom: 6,
                }}
              >
                {String(i18n.t("garmentDetails.careSymbols"))}
              </Text>

              {profile.careSymbols.map((sym: string, i: number) => (
                <Text key={i} style={{ color: "#fff", marginTop: 4 }}>
                  • {sym}
                </Text>
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