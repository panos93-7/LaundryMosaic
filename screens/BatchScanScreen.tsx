import { useNavigation } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { analyzeImageWithGemini } from "../services/analyzeImage";

// ---------------------------------------------
// TYPES
// ---------------------------------------------
type FabricGroup = {
  fabric: string;
  count: number;
  items: any[];
  compatible: boolean;
  conflict: string | null;
};

export default function BatchScanScreen() {
  const navigation = useNavigation<any>();
  const cameraRef = useRef<any>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Request permission on mount
  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) requestPermission();
  }, [permission]);

  const handleScanAgain = () => {
    setResult(null);
    setIsProcessing(false);
  };

  const generateSmartSuggestions = (
    groups: FabricGroup[],
    globalCompatible: boolean
  ) => {
    const suggestions: string[] = [];

    const delicate = groups.filter(
      (g) =>
        g.fabric.toLowerCase().includes("wool") ||
        g.fabric.toLowerCase().includes("delicate")
    );

    const highTemp = groups.filter((g) => {
      const sample = g.items[0];
      return sample.recommended?.temp > 40;
    });

    const cotton = groups.filter((g) =>
      g.fabric.toLowerCase().includes("cotton")
    );

    if (globalCompatible) {
      suggestions.push("All items can be washed together safely.");
    }

    if (delicate.length > 0) {
      suggestions.push("Delicate fabrics (like wool) should be washed separately.");
    }

    if (highTemp.length > 0) {
      suggestions.push(
        "Some fabrics require high temperature — avoid mixing with delicate items."
      );
    }

    if (cotton.length > 0) {
      const totalCotton = cotton.reduce((sum, g) => sum + g.count, 0);
      suggestions.push(
        `You have ${totalCotton} cotton items — ideal for a cotton program.`
      );
    }

    const conflicts = groups.filter((g) => !g.compatible);
    if (conflicts.length > 0) {
      suggestions.push("Some items are incompatible — consider splitting the load.");
    }

    return suggestions;
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);

      // ⭐ CORRECT EXPO CAMERA API
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });

      if (!photo?.base64) {
        throw new Error("Camera did not return base64");
      }

      const base64 = photo.base64;
      const mimeType = "image/jpeg";

      const aiResult = await analyzeImageWithGemini(base64, mimeType);

      if (!aiResult || !aiResult.items || aiResult.items.length === 0) {
        setResult({
          itemsDetected: 0,
          groups: [],
          compatible: false,
          warnings: ["⚠️ Unable to analyze the image"],
          suggestions: [],
        });
        setIsProcessing(false);
        return;
      }

      // GROUP BY FABRIC
      const grouped = aiResult.items.reduce((acc: any, item: any) => {
        const fabric = item.fabric || "Unknown";

        if (!acc[fabric]) {
          acc[fabric] = {
            fabric,
            count: 0,
            items: [],
            compatible: true,
            conflict: null,
          };
        }

        acc[fabric].count += 1;
        acc[fabric].items.push(item);

        return acc;
      }, {});

      const groups: FabricGroup[] = Object.values(grouped);

      // COMPATIBILITY RULES
      let globalCompatible = true;
      let warnings: string[] = [];

      for (const group of groups) {
        const sample = group.items[0];
        const fabric = sample.fabric?.toLowerCase() || "";
        const temp = sample.recommended?.temp || 0;
        const spin = sample.recommended?.spin || 0;

        let incompatible = false;
        let reason: string | null = null;

        if (fabric === "wool" || fabric === "delicate") {
          incompatible = true;
          reason = `The fabric "${sample.fabric}" requires a separate wash.`;
        }

        if (!incompatible && temp > 40) {
          incompatible = true;
          reason = `Temperature ${temp}°C is too high for mixed loads.`;
        }

        if (!incompatible && spin > 1000) {
          incompatible = true;
          reason = `${spin} rpm is too aggressive for delicate fabrics.`;
        }

        group.compatible = !incompatible;
        group.conflict = reason;

        if (incompatible) {
          globalCompatible = false;
          warnings.push(reason!);
        }
      }

      const suggestions = generateSmartSuggestions(groups, globalCompatible);

      setResult({
        itemsDetected: aiResult.items.length,
        groups,
        compatible: globalCompatible,
        warnings,
        suggestions,
      });
    } catch (err) {
      console.log("BatchScan AI error:", err);
      setResult({
        itemsDetected: 0,
        groups: [],
        compatible: false,
        warnings: ["⚠️ Error during analysis"],
        suggestions: [],
      });
    }

    setIsProcessing(false);
  };

  // PERMISSION SCREEN
  if (!permission || !permission.granted) {
    return (
      <LinearGradient
        colors={["#0f0c29", "#302b63", "#24243e"]}
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Text style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}>
          Camera permission required
        </Text>

        <TouchableOpacity
          onPress={requestPermission}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 20,
            backgroundColor: "#2575fc",
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16 }}>Grant Permission</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  // MAIN UI
  return (
    <LinearGradient
      colors={["#0f0c29", "#302b63", "#24243e"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER */}
        <View
          style={{
            paddingHorizontal: 20,
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
            }}
          >
            Batch Scan
          </Text>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: "#ff6b6b", fontSize: 16 }}>Close</Text>
          </TouchableOpacity>
        </View>

        {/* CAMERA VIEW */}
        {!result && (
          <View
            style={{
              flex: 1,
              borderRadius: 20,
              overflow: "hidden",
              margin: 20,
            }}
          >
            <CameraView ref={cameraRef} facing="back" style={{ flex: 1 }} />
          </View>
        )}

        {/* CAPTURE BUTTON */}
        {!result && (
          <View
            style={{
              alignItems: "center",
              marginBottom: 30,
            }}
          >
            <TouchableOpacity
              onPress={handleCapture}
              disabled={isProcessing}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "rgba(255,255,255,0.15)",
                borderWidth: 4,
                borderColor: "#fff",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: "#fff",
                  }}
                />
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* RESULT PANEL */}
        {result && (
          <Animated.View
            entering={FadeInUp.duration(350).springify().damping(18)}
            style={{
              padding: 20,
              backgroundColor: "rgba(0,0,0,0.4)",
              marginHorizontal: 20,
              borderRadius: 16,
              marginBottom: 20,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>
              Items detected: {result.itemsDetected}
            </Text>

            <Text style={{ color: "#fff", marginTop: 6 }}>
              Compatible: {result.compatible ? "Yes" : "No"}
            </Text>

            {/* FABRIC GROUPS */}
            <View style={{ marginTop: 16 }}>
              {result.groups.map((g: FabricGroup, i: number) => (
                <View
                  key={i}
                  style={{
                    padding: 12,
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    marginBottom: 10,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    {g.fabric} × {g.count}
                  </Text>

                  {!g.compatible && (
                    <Text
                      style={{
                        color: "#ff6b6b",
                        marginTop: 6,
                        fontSize: 14,
                      }}
                    >
                      ⚠️ {g.conflict}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {/* GLOBAL WARNINGS */}
            {result.warnings.length > 0 && (
              <View style={{ marginTop: 10 }}>
                {result.warnings.map((w: string, i: number) => (
                  <Text
                    key={i}
                    style={{
                      color: "#ff9f9f",
                      marginTop: 4,
                      fontSize: 14,
                    }}
                  >
                    {w}
                  </Text>
                ))}
              </View>
            )}

            {/* SMART SUGGESTIONS */}
            {result.suggestions.length > 0 && (
              <View
                style={{
                  marginTop: 20,
                  padding: 14,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: "700",
                    marginBottom: 10,
                  }}
                >
                  🔥 Smart Suggestions
                </Text>

                {result.suggestions.map((s: string, i: number) => (
                  <Text
                    key={i}
                    style={{
                      color: "rgba(255,255,255,0.85)",
                      marginBottom: 6,
                      fontSize: 15,
                    }}
                  >
                    • {s}
                  </Text>
                ))}
              </View>
            )}

            {/* SCAN AGAIN BUTTON */}
            <TouchableOpacity
              onPress={handleScanAgain}
              style={{
                marginTop: 16,
                paddingVertical: 12,
                backgroundColor: "rgba(255,255,255,0.15)",
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                Scan Again
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}