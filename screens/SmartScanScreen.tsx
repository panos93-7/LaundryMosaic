import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Animated as RNAnimated,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInUp, Layout } from "react-native-reanimated";
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

  const pulseAnim = useRef(new RNAnimated.Value(1)).current;

  // prevents double analyze + race conditions
  const analyzingRef = useRef(false);

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 900,
          useNativeDriver: true,
        }),
        RNAnimated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  useFocusEffect(
    React.useCallback(() => {
      // SAFE RESET — only if not analyzing
      if (!analyzingRef.current) {
        setImage(null);
        setResult(null);
        setError(null);
        setLoading(false);
      }
      return () => {};
    }, [])
  );

  useFocusEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true
    );
    return () => subscription.remove();
  });

  useEffect(() => {
    (async () => {
      try {
        await ImagePicker.requestCameraPermissionsAsync();
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      } catch (e) {
        console.log("SmartScan: permission request failed", e);
      }
    })();
  }, []);

  // derived safeResult with full guards
  const safeResult = useMemo(() => {
    if (!result || typeof result !== "object") return null;

    const stains = Array.isArray(result.stains) ? result.stains : [];
    const stainTips = Array.isArray(result.stainTips) ? result.stainTips : [];
    const recommended =
      result.recommended && typeof result.recommended === "object"
        ? result.recommended
        : {};

    const care =
      result.care && typeof result.care === "object" ? result.care : {};

    return {
      ...result,
      stains,
      stainTips,
      recommended,
      care,
    };
  }, [result]);

  const careInstructions: string[] = useMemo(() => {
    if (!safeResult || !safeResult.care) return [];

    const c = safeResult.care || {};
    const warnings = Array.isArray(c.warnings) ? c.warnings : [];

    return [
      c.wash,
      c.bleach,
      c.dry,
      c.iron,
      c.dryclean,
      ...warnings,
    ].filter((x) => typeof x === "string" && x.trim().length > 0);
  }, [safeResult]);

  // SAFE RESET
  const resetState = () => {
    if (analyzingRef.current) return;
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
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
      });

      if (!res.canceled) {
        const uri = res.assets?.[0]?.uri;
        if (!uri) {
          console.log("SmartScan: gallery result has no uri");
          setError(i18n.t("smartScan.errorMessage"));
          return;
        }
        setImage(uri);
        Events.aiScanStarted("gallery");
        analyze(uri);
      }
    } catch (e) {
      console.log("SmartScan: pickImage failed", e);
      setError(i18n.t("smartScan.errorMessage"));
    }
  };

  const takePhoto = async () => {
    resetState();
    try {
      const res = await ImagePicker.launchCameraAsync({ quality: 0.9 });

      if (!res.canceled) {
        const uri = res.assets?.[0]?.uri;
        if (!uri) {
          console.log("SmartScan: camera result has no uri");
          setError(i18n.t("smartScan.errorMessage"));
          return;
        }
        setImage(uri);
        Events.aiScanStarted("camera");
        analyze(uri);
      }
    } catch (e) {
      console.log("SmartScan: takePhoto failed", e);
      setError(i18n.t("smartScan.errorMessage"));
    }
  };

  // BULLETPROOF ANALYZE
  const analyze = async (uri: string) => {
    if (!uri) {
      console.log("ANALYZE: no uri provided");
      return;
    }

    if (analyzingRef.current) {
      console.log("ANALYZE: blocked, already analyzing");
      return;
    }
    analyzingRef.current = true;

    console.log("ANALYZE: start with uri =", uri);

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      console.log("ANALYZE: calling preprocessImage");
      const pre = await preprocessImage(uri);
      const base64 =
  (pre && typeof pre === "object" && "base64" in pre && pre.base64) ||
  (pre && typeof pre === "object" && "imageBase64" in pre && pre.imageBase64) ||
  (typeof pre === "string" ? pre : null);
      if (!base64 || typeof base64 !== "string") {
        console.log("ANALYZE: preprocessImage returned invalid base64", pre);
        throw new Error("Invalid base64 from preprocessImage");
      }
      console.log(
        "ANALYZE: preprocessImage OK, base64 length =",
        base64.length
      );

      console.log("ANALYZE: calling analyzeGarmentProCached");
      const ai = await analyzeGarmentProCached(base64);
      console.log("ANALYZE: AI returned:", ai);

      if (!ai || typeof ai !== "object") {
        console.log("ANALYZE: AI result invalid");
        setError(i18n.t("smartScan.errorMessage"));
        return;
      }

      const base = {
        ...ai,
        fabric:
          typeof ai.fabric === "string" && ai.fabric.length > 0
            ? ai.fabric
            : "cotton",
        color:
          typeof ai.color === "string" && ai.color.length > 0
            ? ai.color
            : "white",
        stains: Array.isArray(ai.stains) ? ai.stains : [],
        stainTips: Array.isArray(ai.stainTips) ? ai.stainTips : [],
        recommended:
          ai.recommended && typeof ai.recommended === "object"
            ? ai.recommended
            : {},
        care: ai.care && typeof ai.care === "object" ? ai.care : {},
      };

      console.log(
        "ANALYZE: base object prepared. stains length =",
        base.stains.length
      );

      let stainTips: any[] = [];
      const locale = (i18n as any).language;
      console.log("ANALYZE: locale =", locale);

      if (Array.isArray(base.stains) && base.stains.length > 0) {
        for (const stain of base.stains) {
          try {
            console.log("ANALYZE: generating tips for stain =", stain);
            const rawTips = await generateStainRemovalTipsCached(
              stain,
              base.fabric
            );
            console.log("ANALYZE: rawTips =", rawTips);

            let safeSteps: string[] = [];

            // Case 1: { steps: [...] }
const steps = (rawTips as any)?.steps;
if (Array.isArray(steps)) {
  safeSteps = steps.filter((s: any) => typeof s === "string");
}

// Case 2: array of strings
else if (Array.isArray(rawTips)) {
  safeSteps = rawTips.filter((s: any) => typeof s === "string");
}

// Case 3: single string
else if (typeof rawTips === "string") {
  safeSteps = [rawTips];
}

// Case 4: { tip: "..." }
else if ((rawTips as any)?.tip && typeof (rawTips as any).tip === "string") {
  safeSteps = [(rawTips as any).tip];
}

// Case 5: { tips: [...] }
else {
  const tips = (rawTips as any)?.tips;
  if (Array.isArray(tips)) {
    safeSteps = tips.filter((t: any) => typeof t === "string");
  }
}
            console.log("ANALYZE: safeSteps =", safeSteps);

            if (safeSteps.length === 0) {
              stainTips.push({
                stain,
                tips: [],
              });
              continue;
            }

            console.log("ANALYZE: calling translateStainTips");
            const translatedRaw = await translateStainTips(
              safeSteps,
              locale,
              `stain_${stain}_${base.fabric}`
            );
            console.log("ANALYZE: translatedRaw =", translatedRaw);

            const translated = Array.isArray(translatedRaw)
              ? translatedRaw.filter((s: any) => typeof s === "string")
              : typeof translatedRaw === "string"
              ? [translatedRaw]
              : [];

            console.log("ANALYZE: translated =", translated);

            stainTips.push({
              stain,
              tips: translated,
            });
          } catch (innerErr) {
            console.log(
              "ANALYZE: error in stain loop for stain =",
              stain,
              "err =",
              innerErr
            );
            stainTips.push({
              stain,
              tips: [],
            });
          }
        }
      } else {
        console.log("ANALYZE: no stains found in base.stains");
      }

      console.log(
        "ANALYZE: final stainTips length =",
        stainTips.length,
        " — setting result"
      );

      setResult({
        ...base,
        stainTips,
      });

      console.log("ANALYZE: setResult completed");
    } catch (err) {
      console.log("❌ analyze() failed:", err);
      setError(i18n.t("smartScan.errorMessage"));
    } finally {
      analyzingRef.current = false;
      setLoading(false);
      console.log("ANALYZE: finally block executed");
    }
  };

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

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={["#0f0c29", "#302b63", "#24243e"]}
        style={{ flex: 1, padding: 20 }}
      >
        {/* HEADER */}
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
              {safeResult && !loading && !error && (
                <Animated.View
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
                  {/* FABRIC */}
                  <Animated.Text
                    entering={FadeIn.delay(100)}
                    style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}
                  >
                    🧵 {String(i18n.t("smartScan.fabric"))}:{" "}
                    {String(
                      i18n.t(
                        `fabricValues.${
                          safeResult.fabric ? safeResult.fabric : "cotton"
                        }`
                      )
                    )}
                  </Animated.Text>

                  {/* COLOR */}
                  <Animated.Text
                    entering={FadeIn.delay(200)}
                    style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}
                  >
                    🎨 {String(i18n.t("smartScan.color"))}:{" "}
                    {String(
                      i18n.t(
                        `colorValues.${
                          safeResult.color ? safeResult.color : "white"
                        }`
                      )
                    )}
                  </Animated.Text>

                  {/* STAINS */}
                  <Animated.Text
                    entering={FadeIn.delay(300)}
                    style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}
                  >
                    🧽 {i18n.t("smartScan.stains")}:{" "}
                    {Array.isArray(safeResult.stains) &&
                    safeResult.stains.length > 0
                      ? safeResult.stains.join(", ")
                      : i18n.t("smartScan.noStains")}
                  </Animated.Text>

                  {/* RECOMMENDED PROGRAM */}
                  {safeResult.recommended && (
                    <Animated.Text
                      entering={FadeIn.delay(400)}
                      style={{ color: "#fff", fontSize: 18 }}
                    >
                      ⭐ {i18n.t("smartScan.recommendedProgram")}:{" "}
                      {safeResult.recommended.program ?? "—"} (
                      {safeResult.recommended.temp ?? "?"}°C /{" "}
                      {safeResult.recommended.spin ?? "?"} {i18n.t("rpm")})
                    </Animated.Text>
                  )}

                  {/* CARE INSTRUCTIONS */}
                  {Array.isArray(careInstructions) &&
                    careInstructions.length > 0 && (
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

              {/* STAIN TIPS SECTION */}
{Array.isArray(safeResult.stains) &&
  safeResult.stains.length > 0 && (
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
        {safeResult.stains.join(", ")}
      </Text>

      {canSeeStainTips ? (
        <View>
          {Array.isArray(safeResult.stainTips) &&
            safeResult.stainTips.length > 0 &&
            safeResult.stainTips.map((step: string, i: number) => (
              <View
                key={i}
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
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
                  {i18n.t("smartScan.stainRemovalStep")} {i + 1}
                </Text>

                <Text
                  style={{
                    color: "rgba(255,255,255,0.85)",
                    marginBottom: 4,
                    fontSize: 14,
                  }}
                >
                  {step}
                </Text>
              </View>
            ))}
        </View>
      ) : (
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
                </Animated.View>
              )}
            </View>
          </ScrollView>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}