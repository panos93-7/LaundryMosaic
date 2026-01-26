import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
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

  const [images, setImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const pickImage = async () => {
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: false,
    });

    if (!res.canceled && res.assets?.length > 0) {
      setImages((prev) => [...prev, res.assets[0].uri]);
    }
  };

  const analyzeAll = async () => {
    if (images.length === 0) return;

    setIsProcessing(true);

    const allItems: any[] = [];

    for (const uri of images) {
      try {
        const { base64, mimeType } = await preprocessImage(uri);
        const ai = await analyzeImageWithGemini(base64, mimeType);

        if (!ai) continue;

        // ⭐ SUPPORT BOTH SINGLE ITEM AND MULTI-ITEM AI RESPONSES
        if (Array.isArray(ai.items)) {
          // Multi-item response
          allItems.push(...ai.items);
        } else {
          // Single item response
          allItems.push(ai);
        }
      } catch (err) {
        console.log("❌ Error analyzing image:", err);
      }
    }

    // ⭐ FIXED GROUPING (NO MORE cotton × 3 FROM ONE ITEM)
    const grouped = allItems.reduce((acc: any, item: any) => {
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

    setResult({
      total: allItems.length,
      groups: Object.values(grouped),
    });

    setIsProcessing(false);
  };

  const reset = () => {
    setImages([]);
    setResult(null);
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

        {/* IMAGE PREVIEW */}
        <ScrollView horizontal style={{ paddingHorizontal: 20 }}>
          {images.map((uri, i) => (
            <Image
              key={i}
              source={{ uri }}
              style={{
                width: 120,
                height: 120,
                borderRadius: 12,
                marginRight: 12,
              }}
            />
          ))}
        </ScrollView>

        {/* BUTTONS */}
        {!result && (
          <View style={{ padding: 20 }}>
            <TouchableOpacity
              onPress={pickImage}
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                padding: 16,
                borderRadius: 12,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: "#fff", textAlign: "center", fontSize: 18 }}>
                📸 Add Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={analyzeAll}
              disabled={images.length === 0 || isProcessing}
              style={{
                backgroundColor:
                  images.length === 0 ? "rgba(255,255,255,0.05)" : "#2575fc",
                padding: 16,
                borderRadius: 12,
              }}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", textAlign: "center", fontSize: 18 }}>
                  Analyze All
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* RESULT */}
        {result && (
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