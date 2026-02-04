import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AnimatedReanimated, {
  FadeIn,
  FadeInUp,
  Layout,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Events } from "../analytics/events";
import i18n from "../i18n";
import { useUserStore } from "../store/userStore";
import { analyzeGarmentProCached } from "../utils/AI/analyzeGarmentProCached";
import { generateStainRemovalTipsCached } from "../utils/AI/generateStainRemovalTipsCached";
import { preprocessImage } from "../utils/AI/preprocessImage";
import { translateStainTips } from "../utils/AI/translateStainTips";

export default function SmartScanScreen({ navigation }: any) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const isPremiumAnnual = useUserStore((s) => s.isPremiumAnnual);
  const isPro = useUserStore((s) => s.isPro);
  const userTier = useUserStore((s) => s.userTier);
  const canSeeStainTips = userTier === "pro";

  // 🔥 Pulse animation (scale 1 → 1.1)
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // 🔥 Block hardware back
  useFocusEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true
    );
    return () => subscription.remove();
  });

  useEffect(() => {
    (async () => {
      await ImagePicker.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);

  // Debug log για stain tips
  useEffect(() => {
    if (result) {
      console.log("🔥 STAIN TIPS RAW ON RESULT:", result.stainTips);
    }
  }, [result]);

  const resetState = () => {
    setImage(null);
    setResult(null);
    setError(null);
    setLoading(false);
  };

  const takeAnotherPhoto = () => {
    resetState();
    takePhoto();
  };

  const pickImage = async () => {
    resetState();
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });

    if (!res.canceled) {
      setImage(res.assets[0].uri);
      Events.aiScanStarted("gallery");
      analyze(res.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    resetState();
    const res = await ImagePicker.launchCameraAsync({ quality: 0.9 });

    if (!res.canceled) {
      setImage(res.assets[0].uri);
      Events.aiScanStarted("camera");
      analyze(res.assets[0].uri);
    }
  };

const analyze = async (uri: string) => {
  setLoading(true);
  setResult(null);
  setError(null);

  try {
    const { base64 } = await preprocessImage(uri);

    // ⭐ Cached garment analysis
    const ai = await analyzeGarmentProCached(base64);

    if (!ai) {
      setError(i18n.t("smartScan.errorMessage"));
      setLoading(false);
      return;
    }

    let stainTips: any[] = [];
    const locale = (i18n as any).language;

    // ⭐ Stains loop (ΜΟΝΟ ΜΙΑ ΦΟΡΑ)
    if (Array.isArray(ai.stains) && ai.stains.length > 0) {
      for (const stain of ai.stains) {
        try {
          const rawTips = await generateStainRemovalTipsCached(
            stain,
            ai.fabric
          );

          console.log("🔥 RAW TIPS:", rawTips);

          // ⭐ Normalize ANY possible AI output into an array of strings
          let safeSteps: string[] = [];

          if (Array.isArray(rawTips?.steps)) {
            safeSteps = rawTips.steps.filter(
              (step: any) => typeof step === "string"
            );
          } else if (Array.isArray(rawTips)) {
            safeSteps = rawTips.filter(
              (step: any) => typeof step === "string"
            );
          } else if (typeof rawTips === "string") {
            safeSteps = [rawTips];
          } else if (rawTips?.tip && typeof rawTips.tip === "string") {
            safeSteps = [rawTips.tip];
          } else if (Array.isArray(rawTips?.tips)) {
            safeSteps = rawTips.tips.filter(
              (step: any) => typeof step === "string"
            );
          }

          // ⭐ Always safe array for translated steps
          const translatedRaw = await translateStainTips(
            safeSteps,
            locale,
            `stain_${stain}_${ai.fabric}`
          );

          const translated = Array.isArray(translatedRaw)
            ? translatedRaw.filter((s: any) => typeof s === "string")
            : typeof translatedRaw === "string"
            ? [translatedRaw]
            : [];

          // ⭐ FINAL: tip.tips is ALWAYS array
          stainTips.push({
            stain,
            tips: translated,
          });
        } catch (err) {
          console.log("❌ Error generating stain tips:", err);

          // ⭐ Even on error, push safe empty array
          stainTips.push({
            stain,
            tips: [],
          });
        }
      }
    }

    // ⭐ FINAL RESULT — ALWAYS SAFE
    setResult({ ...ai, stainTips });
  } catch (err) {
    console.log("❌ analyze() failed:", err);
    setError(i18n.t("smartScan.errorMessage"));
  }

  setLoading(false);
};

  // 🔥 REAL SAVE TO PLANNER
  const handleAutoAdd = async () => {
    if (!result) return;

    if (!isPremiumAnnual && !isPro) {
      navigation.navigate("PremiumMonthlyPaywall", { source: "autoAdd" });
      return;
    }

    const now = new Date();

    const newItem = {
      title: result.fabric || i18n.t("smartScan.plannerDefaultTitle"),
      type: result.fabric || i18n.t("smartScan.plannerDefaultType"),
      time: i18n.t("smartScan.plannerAnyTime"),
      day: now.getDate(),
      month: now.getMonth(),
      year: now.getFullYear(),
    };

    try {
      const existing = await AsyncStorage.getItem("PLANS");
      const plans = existing ? JSON.parse(existing) : [];
      plans.push(newItem);
      await AsyncStorage.setItem("PLANS", JSON.stringify(plans));
    } catch (err) {
      console.log("Failed to save to planner", err);
    }

    Events.featureUnlockedUsed("ai_smart_scan", userTier);
    navigation.navigate("Planner");
  };

  // Build careInstructions array from AI care object
const careInstructions = result?.care
  ? [
      result.care.wash,
      result.care.bleach,
      result.care.dry,
      result.care.iron,
      result.care.dryclean,
      ...(Array.isArray(result.care.warnings) ? result.care.warnings : []),
    ].filter(Boolean)
  : [];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={["#0f0c29", "#302b63", "#24243e"]}
        style={{ flex: 1, padding: 20 }}
      >
        {/* ⭐ HEADER */}
        <View
          style={{
            paddingBottom: 10,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
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
            {String(i18n.t("smartScan.title"))}
          </Text>

          <TouchableOpacity onPress={() => navigation.navigate("Home")}>
            <Text style={{ color: "#ff6b6b", fontSize: 16 }}>
              {i18n.t("smartScan.close")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* PHOTO OPTIONS */}
        {!image && (
          <>
            <TouchableOpacity
              onPress={takePhoto}
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                padding: 16,
                borderRadius: 14,
                marginBottom: 12,
              }}
            >
              <Text
                style={{ color: "#fff", textAlign: "center", fontSize: 18 }}
              >
                📸 {i18n.t("smartScan.takePhoto")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={pickImage}
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                padding: 16,
                borderRadius: 14,
              }}
            >
              <Text
                style={{ color: "#fff", textAlign: "center", fontSize: 18 }}
              >
                🖼️ {i18n.t("smartScan.chooseFromGallery")}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* RESULT VIEW */}
        {image && (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 160 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ alignItems: "center", marginTop: 20 }}>
              {/* IMAGE PREVIEW */}
              <Image
                source={{ uri: image }}
                style={{
                  width: 260,
                  height: 260,
                  borderRadius: 14,
                  marginBottom: 20,
                }}
              />

              {/* LOADING */}
              {loading && (
                <ActivityIndicator
                  size="large"
                  color="#fff"
                  style={{ marginTop: 10 }}
                />
              )}

              {/* ERROR PANEL */}
              {error && !loading && (
                <View
                  style={{
                    backgroundColor: "rgba(255, 80, 80, 0.15)",
                    padding: 20,
                    borderRadius: 14,
                    width: "100%",
                    marginTop: 10,
                    borderWidth: 1,
                    borderColor: "rgba(255, 80, 80, 0.4)",
                  }}
                >
                  <Text
                    style={{
                      color: "#ff6b6b",
                      fontSize: 18,
                      marginBottom: 10,
                    }}
                  >
                    ❌ {i18n.t("smartScan.errorTitle")}
                  </Text>

                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 16,
                      marginBottom: 20,
                    }}
                  >
                    {i18n.t("smartScan.errorMessage")}
                  </Text>

                  <TouchableOpacity
                    onPress={() => analyze(image!)}
                    style={{
                      backgroundColor: "#ff6b6b",
                      padding: 14,
                      borderRadius: 12,
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
                      {i18n.t("smartScan.retry")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={takeAnotherPhoto}
                    style={{
                      marginTop: 12,
                      padding: 14,
                      borderRadius: 12,
                      backgroundColor: "rgba(255,255,255,0.15)",
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
                      {i18n.t("smartScan.takeAnother")}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* RESULT PANEL */}
              {result && !loading && !error && (
                <AnimatedReanimated.View
                  entering={FadeInUp.duration(500).springify()}
                  layout={Layout.springify()}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    padding: 20,
                    borderRadius: 14,
                    width: "100%",
                    marginTop: 10,
                  }}
                >
                  <AnimatedReanimated.Text
                    entering={FadeIn.delay(100)}
                    style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}
                  >
                    🧵 {String(i18n.t("smartScan.fabric"))}:{" "}
                    {String(
                      i18n.t(
                        `fabricValues.${result?.fabric ? result.fabric : "cotton"}`
                      )
                    )}
                  </AnimatedReanimated.Text>

                  <AnimatedReanimated.Text
                    entering={FadeIn.delay(200)}
                    style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}
                  >
                    🎨 {String(i18n.t("smartScan.color"))}:{" "}
                    {String(
                      i18n.t(
                        `colorValues.${result?.color ? result.color : "white"}`
                      )
                    )}
                  </AnimatedReanimated.Text>

                  <AnimatedReanimated.Text
                    entering={FadeIn.delay(300)}
                    style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}
                  >
                    🧽 {i18n.t("smartScan.stains")}:{" "}
                    {Array.isArray(result?.stains) &&
                    result.stains.length > 0
                      ? result.stains.join(", ")
                      : i18n.t("smartScan.noStains")}
                  </AnimatedReanimated.Text>

                  {/* RECOMMENDED PROGRAM */}
                  {result?.recommended && (
                    <AnimatedReanimated.Text
                      entering={FadeIn.delay(400)}
                      style={{ color: "#fff", fontSize: 18 }}
                    >
                      ⭐ {i18n.t("smartScan.recommendedProgram")}:{" "}
                      {result?.recommended?.program ?? "—"} (
                      {result?.recommended?.temp ?? "?"}°C /{" "}
                      {result?.recommended?.spin ?? "?"} {i18n.t("rpm")})
                    </AnimatedReanimated.Text>
                  )}

{/* CARE INSTRUCTIONS */}
{careInstructions.length > 0 && (
  <View style={{ marginTop: 20 }}>
    <Text
      style={{
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 10,
      }}
    >
      🧼 {i18n.t("smartScan.careInstructions")}
    </Text>

    {careInstructions.map((line: string, i: number) => (
      <Text
        key={i}
        style={{
          color: "rgba(255,255,255,0.8)",
          marginBottom: 4,
          fontSize: 15,
        }}
      >
        • {line}
      </Text>
    ))}
  </View>
)}

                  {/* STAIN SECTION */}
                  {Array.isArray(result?.stains) &&
                    result.stains.length > 0 && (
                      <View style={{ marginTop: 25 }}>
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 18,
                            fontWeight: "700",
                            marginBottom: 10,
                          }}
                        >
                          🧴 {i18n.t("smartScan.stainsDetected")}:{" "}
                          {result.stains.join(", ")}
                        </Text>

                        {canSeeStainTips ? (
                          // ⭐ PRO → βλέπει stain removal tips
                          <View>
                            {Array.isArray(result?.stainTips) &&
                              result.stainTips.map(
                                (tip: any, i: number) => (
                                  <View
                                    key={i}
                                    style={{
                                      backgroundColor:
                                        "rgba(255,255,255,0.08)",
                                      padding: 14,
                                      borderRadius: 12,
                                      marginBottom: 12,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: "#fff",
                                        fontSize: 16,
                                        fontWeight: "600",
                                        marginBottom: 6,
                                      }}
                                    >
                                      {tip.stain}
                                    </Text>

                                    {Array.isArray(tip?.tips) &&
                                      tip.tips.map(
                                        (step: string, idx: number) => (
                                          <Text
                                            key={idx}
                                            style={{
                                              color:
                                                "rgba(255,255,255,0.85)",
                                              marginBottom: 4,
                                              fontSize: 14,
                                            }}
                                          >
                                            {idx + 1}. {step}
                                          </Text>
                                        )
                                      )}
                                  </View>
                                )
                              )}
                          </View>
                        ) : (
                          // ⭐ NON-PRO → CTA
                          <View
                            style={{
                              width: "100%",
                              alignItems: "center",
                              marginTop: 20,
                            }}
                          >
                            <Animated.View
                              style={{
                                width: "100%",
                                transform: [{ scale: pulseAnim }],
                              }}
                            >
                              <TouchableOpacity
                                onPress={() =>
                                  navigation.navigate("Paywall", {
                                    source: "stainTips",
                                  })
                                }
                                activeOpacity={0.9}
                                style={{
                                  width: "100%",
                                  backgroundColor: "#314A7A",
                                  paddingVertical: 18,
                                  borderRadius: 14,
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderWidth: 1.5,
                                  borderColor: "rgba(255,255,255,0.15)",
                                }}
                              >
                                <View style={{ alignItems: "center" }}>
                                  <Text
                                    style={{
                                      color: "#FFCC4D",
                                      fontSize: 17,
                                      fontWeight: "700",
                                    }}
                                  >
                                    {i18n
                                      .t("smartScan.unlockStainCare")
                                      .split(" ")
                                      .slice(0, 3)
                                      .join(" ")}
                                  </Text>
                                  <Text
                                    style={{
                                      color: "#FFCC4D",
                                      fontSize: 17,
                                      fontWeight: "700",
                                      marginTop: -2,
                                    }}
                                  >
                                    {i18n
                                      .t("smartScan.unlockStainCare")
                                      .split(" ")
                                      .slice(3)
                                      .join(" ")}
                                  </Text>
                                  <Text
                                    style={{
                                      color: "#FFCC4D",
                                      fontSize: 16,
                                      fontWeight: "900",
                                      marginTop: 4,
                                      opacity: 1,
                                    }}
                                  >
                                    PRO
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            </Animated.View>
                          </View>
                        )}
                      </View>
                    )}

                  {/* TAKE ANOTHER PHOTO */}
                  <TouchableOpacity
                    onPress={takeAnotherPhoto}
                    style={{
                      marginTop: 20,
                      backgroundColor: "rgba(255,255,255,0.15)",
                      padding: 14,
                      borderRadius: 12,
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
                      {i18n.t("smartScan.takeAnother")}
                    </Text>
                  </TouchableOpacity>

                  {/* CLOSE RESULT */}
                  <TouchableOpacity
                    onPress={resetState}
                    style={{
                      marginTop: 14,
                      backgroundColor: "rgba(255,255,255,0.15)",
                      padding: 14,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        textAlign: "center",
                        fontSize: 18,
                        fontWeight: "700",
                      }}
                    >
                      {i18n.t("smartScan.close")}
                    </Text>
                  </TouchableOpacity>

                  {/* ADD TO PLANNER */}
                  <TouchableOpacity
                    onPress={handleAutoAdd}
                    style={{
                      marginTop: 14,
                      backgroundColor: "#2575fc",
                      padding: 14,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        textAlign: "center",
                        fontSize: 18,
                        fontWeight: "700",
                      }}
                    >
                      {i18n.t("smartScan.addToPlanner")}
                    </Text>
                  </TouchableOpacity>
                </AnimatedReanimated.View>
              )}
            </View>
          </ScrollView>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}