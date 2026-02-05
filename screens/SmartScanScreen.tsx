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

type CareFields = {
  wash?: string;
  bleach?: string;
  dry?: string;
  iron?: string;
  dryclean?: string;
  warnings?: string[];
};

const SAFE_FALLBACK = {
  stains: [],
  stainTips: [],
  recommended: {},
  care: {} as CareFields,
  fabric: "cotton",
  color: "white",
};

export default function SmartScanScreen({ navigation }: any) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const isPremiumAnnual = useUserStore((s) => s.isPremiumAnnual);
  const isPro = useUserStore((s) => s.isPro);
  const userTier = useUserStore((s) => s.userTier);
  const canSeeStainTips = userTier === "pro";
  const [sourceType, setSourceType] = useState<"camera" | "gallery" | null>(null);
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;
  const analyzingRef = useRef(false);

  // Pulse animation
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

  // Reset on screen focus
  useFocusEffect(
    React.useCallback(() => {
      if (!analyzingRef.current) {
        setImage(null);
        setResult(null);
        setError(null);
        setLoading(false);
      }
      return () => {};
    }, [])
  );

  // Disable hardware back
  useFocusEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true
    );
    return () => subscription.remove();
  });

  // Permissions
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

  // SAFE RESULT — ΠΟΤΕ ΔΕΝ ΕΙΝΑΙ null
  const safeResult = useMemo(() => {
  if (!result || typeof result !== "object") return SAFE_FALLBACK;

  const stains = Array.isArray(result.stains) ? result.stains : [];
  const stainTips = Array.isArray(result.stainTips) ? result.stainTips : [];
  const recommended =
    result.recommended && typeof result.recommended === "object"
      ? result.recommended
      : {};

  const care =
    result.care && typeof result.care === "object"
      ? (result.care as CareFields)
      : ({} as CareFields);

  return {
    ...SAFE_FALLBACK,
    ...result,
    stains,
    stainTips,
    recommended,
    care,
    fabric: typeof result.fabric === "string" ? result.fabric : "cotton",
    color: typeof result.color === "string" ? result.color : "white",
  };
}, [result]);

// CARE INSTRUCTIONS — ΠΑΝΤΑ array of strings
const careInstructions: string[] = useMemo(() => {
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

// RESET
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
      setSourceType("gallery");
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
      setSourceType("camera");
      setImage(uri);
      Events.aiScanStarted("camera");
      analyze(uri);
    }
  } catch (e) {
    console.log("SmartScan: takePhoto failed", e);
    setError(i18n.t("smartScan.errorMessage"));
  }
};
async function safeTranslate(input: any, locale: string, key: string) {
  try {
    const res = await translateStainTips(input, locale, key);
    return res;
  } catch (e) {
    return input; // fallback: no translation
  }
}
const analyze = async (uri: string) => {
  if (!uri) return;
  if (analyzingRef.current) return;
  analyzingRef.current = true;

  setLoading(true);
  setResult(null);
  setError(null);

  try {
    const pre = await preprocessImage(uri);
    let base64: string | null = null;

    if (typeof pre === "string") {
      base64 = pre;
    } else if (pre && typeof pre === "object") {
      const p = pre as any;
      if (typeof p.base64 === "string") base64 = p.base64;
      else if (typeof p.imageBase64 === "string") base64 = p.imageBase64;
    }

    if (!base64) throw new Error("Invalid base64");

    const ai = await analyzeGarmentProCached(base64);

    // HARD VALIDATION
if (
  !ai ||
  typeof ai !== "object" ||
  (
    typeof ai.fabric !== "string" &&
    typeof ai.color !== "string" &&
    !Array.isArray(ai.stains) &&
    typeof ai.care !== "object"
  )
) {
  setError(i18n.t("smartScan.errorMessage"));
  analyzingRef.current = false;
  setLoading(false);
  return;
}
    const base = {
      ...ai,
      fabric: typeof ai.fabric === "string" ? ai.fabric : "cotton",
      color: typeof ai.color === "string" ? ai.color : "white",
      stains: Array.isArray(ai.stains) ? ai.stains : [],
      stainTips: Array.isArray(ai.stainTips) ? ai.stainTips : [],
      recommended:
        (ai.recommended && typeof ai.recommended === "object"
          ? ai.recommended
          : {}) as { program?: string },
      care:
        (ai.care && typeof ai.care === "object"
          ? ai.care
          : {}) as CareFields,
    };

    const locale = (i18n as any).language;

    // CARE ARRAY (safe)
    const careArray = (() => {
      const c = base.care || {};
      const warnings = Array.isArray(c.warnings)
        ? c.warnings.filter((w) => typeof w === "string")
        : [];

      return [
        typeof c.wash === "string" ? c.wash : "",
        typeof c.bleach === "string" ? c.bleach : "",
        typeof c.dry === "string" ? c.dry : "",
        typeof c.iron === "string" ? c.iron : "",
        typeof c.dryclean === "string" ? c.dryclean : "",
        ...warnings,
      ].filter((x) => x.trim().length > 0);
    })();

    // TRANSLATE EVERYTHING (SAFE)
    const translatedFabric = await safeTranslate(
      typeof base.fabric === "string" ? base.fabric : "",
      locale,
      "fabric"
    );

    const translatedColor = await safeTranslate(
      typeof base.color === "string" ? base.color : "",
      locale,
      "color"
    );

    const translatedStains = await safeTranslate(
      Array.isArray(base.stains)
        ? base.stains.filter((s) => typeof s === "string")
        : [],
      locale,
      "stains"
    );

    const translatedCare = await safeTranslate(
      careArray,
      locale,
      "care"
    );

    const translatedProgram = await safeTranslate(
      typeof base.recommended?.program === "string"
        ? base.recommended.program
        : "",
      locale,
      "program"
    );

    // TRANSLATE STAIN TIPS (per stain)
    let stainTips: any[] = [];

    if (Array.isArray(base.stains) && base.stains.length > 0) {
      for (const stain of base.stains) {
        try {
          const rawTips = await generateStainRemovalTipsCached(
            stain,
            base.fabric
          );

          let safeSteps: string[] = [];

          if (Array.isArray(rawTips)) {
            safeSteps = rawTips.filter((s) => typeof s === "string");
          } else if (rawTips && typeof rawTips === "object") {
            const obj = rawTips as any;

            if (Array.isArray(obj.steps)) {
              safeSteps = obj.steps.filter((s: any) => typeof s === "string");
            } else if (Array.isArray(obj.tips)) {
              safeSteps = obj.tips.filter((s: any) => typeof s === "string");
            } else if (typeof obj.tip === "string") {
              safeSteps = [obj.tip];
            }
          } else if (typeof rawTips === "string") {
            safeSteps = [rawTips];
          }

          const translatedRaw = await safeTranslate(
            safeSteps,
            locale,
            `stain_${stain}_${base.fabric}`
          );

          const translated = Array.isArray(translatedRaw)
            ? translatedRaw.filter((s: any) => typeof s === "string")
            : typeof translatedRaw === "string"
            ? [translatedRaw]
            : [];

          stainTips.push({ stain, tips: translated });
        } catch (err) {
          stainTips.push({ stain, tips: [] });
        }
      }
    }
const cleanStains = Array.isArray(translatedStains)
  ? translatedStains.filter(
      (s) => typeof s === "string" && s.trim().length > 0
    )
  : [];
setResult({
  ...base,

  fabric: Array.isArray(translatedFabric)
    ? translatedFabric[0] || base.fabric
    : typeof translatedFabric === "string"
    ? translatedFabric
    : base.fabric,

  color: Array.isArray(translatedColor)
    ? translatedColor[0] || base.color
    : typeof translatedColor === "string"
    ? translatedColor
    : base.color,

  stains: cleanStains,

  care: base.care,

  recommended: {
    ...base.recommended,
    program: Array.isArray(translatedProgram)
      ? translatedProgram[0] || base.recommended?.program
      : typeof translatedProgram === "string"
      ? translatedProgram
      : base.recommended?.program,
  },

  stainTips: Array.isArray(stainTips)
    ? stainTips.map((item) => ({
        stain: typeof item.stain === "string" ? item.stain : "",
        tips: Array.isArray(item.tips)
  ? (item.tips as string[]).filter(
      (s) => typeof s === "string" && s.trim().length > 0
    )
  : [],
      }))
    
    : [],
});
  } catch (err) {
  setError(i18n.t("smartScan.errorMessage"));
  setImage(null);
  setResult(null);
  analyzingRef.current = false;
  setLoading(false);
  return; // ⭐ ΑΥΤΟ ΛΕΙΠΕΙ
 } finally {
  analyzingRef.current = false;
  setLoading(false);
}
};
 const handleAutoAdd = async () => {
  try {
    const payload = {
      image,
      result: {
        fabric: safeResult.fabric ?? null,
        color: safeResult.color ?? null,
        stains: Array.isArray(safeResult.stains) ? safeResult.stains : [],
        stainTips: Array.isArray(safeResult.stainTips) ? safeResult.stainTips : [],
        recommended: safeResult.recommended ?? null,
        care: Array.isArray(safeResult.care) ? safeResult.care : [],
      },
      createdAt: Date.now(),
    };

    await AsyncStorage.setItem(
      "smartScan:lastResult",
      JSON.stringify(payload)
    );

    navigation.navigate("Planner", { source: "smartScan" });
  } catch (e) {
    console.log("SmartScan: handleAutoAdd failed", e);
  }
};

  // UI
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
              <Text style={{ color: "#fff", textAlign: "center", fontSize: 18 }}>
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
              <Text style={{ color: "#fff", textAlign: "center", fontSize: 18 }}>
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
{/* EMPTY STATE (image but no loading, no error, no result) */}
{image && !loading && !error && !result && (
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
                        {safeResult.fabric ?? "-"}
                  </Animated.Text>

                  {/* COLOR */}
                  <Animated.Text
                    entering={FadeIn.delay(200)}
                    style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}
                  >
                    🎨 {String(i18n.t("smartScan.color"))}:{" "}
                    🎨 {safeResult.color ?? "-"}
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
                      {safeResult.recommended.spin ?? "?"}{" "}
                      {i18n.t("rpm")})
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
                        {Array.isArray(careInstructions) && careInstructions.map((line: string, i: number) => (
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
{Array.isArray(safeResult.stains) && safeResult.stains.length > 0 && (
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
        {(() => {
          // ⭐ 1. TYPE
          type StainTip = { stain: string; tips: string[] };

          // ⭐ 2. RAW ARRAY (SAFE)
          const raw: unknown[] = Array.isArray(safeResult.stainTips)
            ? safeResult.stainTips
            : [];

          // ⭐ 3. VALIDATE ITEMS
          const valid: StainTip[] = raw.filter(
            (item): item is StainTip =>
              typeof item === "object" &&
              item !== null &&
              typeof (item as any).stain === "string" &&
              Array.isArray((item as any).tips)
          );

          // ⭐ 4. RENDER
          return valid.map((item, i) => {
            const steps = item.tips.filter(
              (s: unknown): s is string =>
                typeof s === "string" && s.trim().length > 0
            );

            return (
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
                  {item.stain}
                </Text>

                {steps.map((step, idx) => (
                  <Text
                    key={idx}
                    style={{
                      color: "rgba(255,255,255,0.85)",
                      marginBottom: 4,
                      fontSize: 14,
                    }}
                  >
                    {idx + 1}. {step}
                  </Text>
                ))}
              </View>
            );
          });
        })()}
      </View>
    ) : (
      /* PAYWALL BUTTON (unchanged) */
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
{/* TAKE OR UPLOAD ANOTHER PHOTO */}
<TouchableOpacity
  onPress={sourceType === "camera" ? takeAnotherPhoto : pickImage}
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
    {sourceType === "camera"
      ? i18n.t("smartScan.takeAnother")       // "Take another photo"
      : i18n.t("smartScan.uploadAnother")}    // "Upload another photo"
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