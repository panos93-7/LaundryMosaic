import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
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

import Reanimated, {
  FadeIn,
  FadeInUp,
  Layout,
} from "react-native-reanimated"; // ⭐ Reanimated components + entering/layout

import { SafeAreaView } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../i18n";
import { useUserStore } from "../store/userStore";

// AI pipeline
import { preprocessImage } from "../utils/AI/Core/preprocessImage";
import { buildSmartScanResult } from "../utils/AI/SmartScan/buildSmartScanResult";

const SAFE_FALLBACK = {
  fabric: "—",
  color: "—",
  stains: [],
  care: [],
  recommended: { program: "—", temp: "—", spin: "—" },
  stainTips: [],
};

export default function SmartScanScreen({ navigation }: any) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const isPro = useUserStore((s) => s.isPro);
  const userTier = useUserStore((s) => s.userTier);
  const canSeeStainTips = userTier === "pro";

  const [sourceType, setSourceType] = useState<"camera" | "gallery" | null>(
    null
  );

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const analyzingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const [cameraReady, setCameraReady] = useState(false);

  // Pulse animation
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
      } finally {
        setCameraReady(true);
      }
    })();
  }, []);

  // SAFE RESULT
  const safeResult = useMemo(() => {
    if (!result || typeof result !== "object") return SAFE_FALLBACK;

    const normalizeStains = (arr: any[]) =>
      arr
        .map((s) => {
          if (typeof s === "string") return s.trim();
          if (s && typeof s === "object" && typeof s.type === "string") {
            return s.type.trim();
          }
          return "";
        })
        .filter((s) => s.length > 0);

    return {
      fabric:
        typeof result.fabric === "string" && result.fabric.trim()
          ? result.fabric
          : "—",
      color:
        typeof result.color === "string" && result.color.trim()
          ? result.color
          : "—",
      stains: Array.isArray(result.stains)
        ? normalizeStains(result.stains)
        : [],
      care: Array.isArray(result.care) ? result.care : [],
      recommended:
        result.recommended && typeof result.recommended === "object"
          ? {
              program:
                typeof result.recommended.program === "string" &&
                result.recommended.program.trim()
                  ? result.recommended.program
                  : "—",
              temp: result.recommended.temp ?? "—",
              spin: result.recommended.spin ?? "—",
            }
          : SAFE_FALLBACK.recommended,
      stainTips: Array.isArray(result.stainTips) ? result.stainTips : [],
    };
  }, [result]);

  const resetState = () => {
    if (abortRef.current) abortRef.current.abort();
    analyzingRef.current = false;
    setImage(null);
    setResult(null);
    setError(null);
    setLoading(false);
  };

  const takeAnotherPhoto = () => {
    resetState();
    takePhoto();
  };

  const safeLaunchCamera = async () => {
    try {
      return await ImagePicker.launchCameraAsync({ quality: 0.9 });
    } catch (e) {
      await new Promise((r) => setTimeout(r, 300));
      return await ImagePicker.launchCameraAsync({ quality: 0.9 });
    }
  };

  const safeLaunchGallery = async () => {
    try {
      return await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
      });
    } catch (e) {
      await new Promise((r) => setTimeout(r, 300));
      return await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
      });
    }
  };

  const pickImage = async () => {
    resetState();
    try {
      const res = await safeLaunchGallery();
      if (!res.canceled) {
        const uri = res.assets?.[0]?.uri;
        if (!uri) {
          setError(i18n.t("smartScan.errorMessage"));
          return;
        }
        setSourceType("gallery");
        setImage(uri);
        analyze(uri);
      }
    } catch (e) {
      setError(i18n.t("smartScan.errorMessage"));
    }
  };

  const takePhoto = async () => {
    resetState();
    try {
      const res = await safeLaunchCamera();
      if (!res.canceled) {
        const uri = res.assets?.[0]?.uri;
        if (!uri) {
          setError(i18n.t("smartScan.errorMessage"));
          return;
        }
        setSourceType("camera");
        setImage(uri);
        analyze(uri);
      }
    } catch (e) {
      setError(i18n.t("smartScan.errorMessage"));
    }
  };

  // ANALYZE
  const analyze = async (uri: string) => {
  console.log("🚀 analyze() CALLED with URI:", uri);

  // --- FIX: ξεμπλοκάρει αν έχει μείνει true από πριν ---
  if (analyzingRef.current) {
    console.log("⛔ analyze() was BLOCKED — analyzingRef was TRUE. Forcing reset.");
    analyzingRef.current = false;
  }

  try {
    analyzingRef.current = true;
    setLoading(true);
    setError(null);
    setResult(null);

    abortRef.current = new AbortController();

    console.log("🟦 preprocessImage START");
    const { base64 } = await preprocessImage(uri);
    console.log("🟩 preprocessImage DONE, base64 length:", base64?.length);

    if (!base64) {
      console.log("❌ preprocessImage returned EMPTY base64");
      setError(i18n.t("smartScan.errorMessage"));
      return;
    }

    console.log("🟦 buildSmartScanResult START");
    const scan = await buildSmartScanResult(base64, {
      signal: abortRef.current.signal,
    });
    console.log("🟩 buildSmartScanResult DONE:", scan);

    if (!scan || typeof scan !== "object") {
      console.log("❌ scan is NULL or invalid");
      setError(i18n.t("smartScan.errorMessage"));
      return;
    }

    const translated = scan.translated ?? {};
    const stainTips = Array.isArray(scan.stainTips) ? scan.stainTips : [];

    setResult({
      fabric: translated.fabric ?? "—",
      color: translated.color ?? "—",
      stains: Array.isArray(translated.stains) ? translated.stains : [],
      care: Array.isArray(translated.care) ? translated.care : [],
      recommended: {
        program: translated.recommended?.program ?? "—",
        temp: translated.recommended?.temp ?? "—",
        spin: translated.recommended?.spin ?? "—",
      },
      stainTips,
    });
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.log("⛔ SmartScan aborted");
      return;
    }
    console.log("❌ SmartScan: analyze() fatal error:", err);
    setError(i18n.t("smartScan.errorMessage"));
    setResult(null);
  } finally {
    analyzingRef.current = false; // --- FIX: πάντα reset ---
    setLoading(false);
    console.log("🔚 analyze() FINISHED");
  }
};

  const handleAutoAdd = async () => {
    try {
      const payload = {
        title: safeResult?.recommended?.program || "",
        type: safeResult?.fabric || "",
        time: "12:00",
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <LinearGradient
  colors={["#0f0c29", "#302b63", "#24243e"]}
  style={{
    flex: 1,
    paddingHorizontal: 20,
  }}
>
{/* HEADER */}
<View
  style={{
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 10,
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

  <TouchableOpacity onPress={() => navigation.goBack()}>
    <Text style={{ color: "#ff6b6b", fontSize: 16 }}>
      {String(i18n.t("smartScan.close"))}
    </Text>
  </TouchableOpacity>
</View>

        {/* CAMERA NOT READY */}
        {!cameraReady && (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="large" color="#fff" />
            <Text style={{ color: "#fff", marginTop: 10, fontSize: 18 }}>
              {i18n.t("smartScan.loadingCamera")}
            </Text>
          </View>
        )}

        {/* PHOTO OPTIONS */}
        {!image && cameraReady && (
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
                <Reanimated.View
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
                  <Reanimated.Text
                    entering={FadeIn.delay(100)}
                    style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}
                  >
                    🧵 {String(i18n.t("smartScan.fabric"))}:{" "}
                    {safeResult.fabric}
                  </Reanimated.Text>

                  {/* COLOR */}
                  <Reanimated.Text
                    entering={FadeIn.delay(200)}
                    style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}
                  >
                    🎨 {String(i18n.t("smartScan.color"))}:{" "}
                    {safeResult.color}
                  </Reanimated.Text>

                  {/* STAINS */}
                  <Reanimated.Text
                    entering={FadeIn.delay(300)}
                    style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}
                  >
                    🧽 {String(i18n.t("smartScan.stains"))}:{" "}
                    {safeResult.stains.length > 0
                      ? safeResult.stains.join(", ")
                      : String(i18n.t("smartScan.noStains"))}
                  </Reanimated.Text>

                  {/* RECOMMENDED PROGRAM */}
                  {safeResult.recommended && (
                    <Reanimated.Text
                      entering={FadeIn.delay(400)}
                      style={{ color: "#fff", fontSize: 18 }}
                    >
                      ⭐ {i18n.t("smartScan.recommendedProgram")}:{" "}
                      {safeResult.recommended.program} (
                      {safeResult.recommended.temp}°C /{" "}
                      {safeResult.recommended.spin} {i18n.t("rpm")})
                    </Reanimated.Text>
                  )}

                  {/* CARE INSTRUCTIONS */}
                  {safeResult.care.length > 0 && (
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

                      {safeResult.care.map((line: string, i: number) => (
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
                  {/* STAIN TIPS */}
                  {safeResult.stains.length > 0 && (
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
    {safeResult.stainTips.length > 0 && (
      <View
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
          {safeResult.stains.join(", ")}
        </Text>

        {safeResult.stainTips.map((step: string, idx: number) => (
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
    )}
  </View>
) : (
                        /* PAYWALL BUTTON */
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
                    onPress={
                      sourceType === "camera" ? takeAnotherPhoto : pickImage
                    }
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
                        ? i18n.t("smartScan.takeAnother")
                        : i18n.t("smartScan.uploadAnother")}
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
                </Reanimated.View>
              )}
            </View>
          </ScrollView>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}