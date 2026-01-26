import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { analyzeImageWithGemini } from "../services/analyzeImage";
import { preprocessImage } from "../utils/AI/preprocessImage";

export default function BatchScanScreen() {
  const navigation = useNavigation<any>();

  const [photo, setPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  // ⭐ Open camera immediately
  useEffect(() => {
    openCamera();
  }, []);

  const openCamera = async () => {
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: false,
    });

    if (!res.canceled && res.assets?.length > 0) {
      setPhoto(res.assets[0].uri);
      analyze(res.assets[0].uri);
    } else {
      navigation.goBack();
    }
  };

  const analyze = async (uri: string) => {
    setIsProcessing(true);

    try {
      const { base64, mimeType } = await preprocessImage(uri);
      const ai = await analyzeImageWithGemini(base64, mimeType);

      if (!ai) {
        setIsProcessing(false);
        return;
      }

      // ⭐ SUPPORT SINGLE + MULTI ITEM
      let items: any[] = [];

      if (Array.isArray(ai.items)) {
        items = ai.items;
      } else {
        items = [ai];
      }

      // ⭐ GROUPING
      const grouped = items.reduce((acc: any, item: any) => {
        const fabric = item.fabric || "Unknown";

        if (!acc[fabric]) {
          acc[fabric] = {
            fabric,
            count: 0,
            items: [],
          };
        }

        acc[fabric].count += 1;
        acc[fabric].items.push(item);

        return acc;
      }, {});

      // ⭐ COMPATIBILITY
      const fabrics = Object.keys(grouped);
      const conflicts: string[] = [];

      if (fabrics.includes("wool") && fabrics.some(f => f !== "wool")) {
        conflicts.push("Wool items should be washed separately.");
      }

      if (fabrics.includes("delicate") && fabrics.some(f => f !== "delicate")) {
        conflicts.push("Delicate items should not be mixed with other fabrics.");
      }

      if (fabrics.includes("cotton") && fabrics.includes("wool")) {
        conflicts.push("Cotton and wool require different temperatures.");
      }

      // ⭐ SUGGESTIONS
      const suggestions: string[] = [];

      if (fabrics.includes("cotton") && fabrics.length === 1) {
        suggestions.push("Perfect load for Cotton Colors program.");
      }

      if (fabrics.includes("synthetics") && fabrics.length === 1) {
        suggestions.push("Synthetics load detected — use Synthetics program.");
      }

      if (items.some(i => i.stains?.length > 0)) {
        suggestions.push("Some items have stains — consider pre-treatment.");
      }

      if (fabrics.length > 1 && conflicts.length === 0) {
        suggestions.push("Mixed load detected — use a gentle mixed program.");
      }

      setResult({
        total: items.length,
        groups: Object.values(grouped),
        conflicts,
        suggestions,
      });
    } catch (err) {
      console.log("❌ Error analyzing image:", err);
    }

    setIsProcessing(false);
  };

  const reset = () => {
    setPhoto(null);
    setResult(null);
    openCamera();
  };

  return (
    <LinearGradient
      colors={["#0f0c29", "#302b63", "#24243e"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER */}
        <View
          style={{
            padding: 20,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 28, fontWeight: "700" }}>
            Batch Scan
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: "#ff6b6b", fontSize: 16 }}>Close</Text>
          </TouchableOpacity>
        </View>

        {/* PHOTO PREVIEW */}
        {photo && (
          <Image
            source={{ uri: photo }}
            style={{
              width: "90%",
              height: 260,
              alignSelf: "center",
              borderRadius: 16,
              marginTop: 10,
            }}
          />
        )}

        {/* LOADING */}
        {isProcessing && (
          <View style={{ marginTop: 40 }}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={{ color: "#fff", textAlign: "center", marginTop: 10 }}>
              Analyzing…
            </Text>
          </View>
        )}

        {/* RESULT */}
        {result && !isProcessing && (
          <Animated.View
            entering={FadeInUp.duration(350)}
            style={{
              padding: 20,
              margin: 20,
              backgroundColor: "rgba(0,0,0,0.4)",
              borderRadius: 16,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
              Items detected: {result.total}
            </Text>

            {/* GROUPS */}
            <View style={{ marginTop: 16 }}>
              {result.groups.map((g: any, i: number) => (
                <View
                  key={i}
                  style={{
                    padding: 12,
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                    {g.fabric} × {g.count}
                  </Text>
                </View>
              ))}
            </View>

            {/* CONFLICTS */}
            {result.conflicts.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text style={{ color: "#ff6b6b", fontSize: 18, fontWeight: "700" }}>
                  ⚠️ Conflicts
                </Text>
                {result.conflicts.map((c: string, i: number) => (
                  <Text key={i} style={{ color: "#fff", marginTop: 6 }}>
                    • {c}
                  </Text>
                ))}
              </View>
            )}

            {/* SUGGESTIONS */}
            {result.suggestions.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text style={{ color: "#4cd964", fontSize: 18, fontWeight: "700" }}>
                  💡 Suggestions
                </Text>
                {result.suggestions.map((s: string, i: number) => (
                  <Text key={i} style={{ color: "#fff", marginTop: 6 }}>
                    • {s}
                  </Text>
                ))}
              </View>
            )}

            <TouchableOpacity
              onPress={reset}
              style={{
                marginTop: 16,
                padding: 12,
                backgroundColor: "rgba(255,255,255,0.15)",
                borderRadius: 12,
              }}
            >
              <Text style={{ color: "#fff", textAlign: "center", fontSize: 16 }}>
                Scan Again
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}