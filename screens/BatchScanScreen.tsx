import { useNavigation } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Animated, { FadeInUp } from "react-native-reanimated";

import { analyzeImageWithGemini } from "../services/analyzeImage";
import { preprocessImage } from "../utils/AI/preprocessImage";

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

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);

      // 1) Take photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });

      // 2) Preprocess (resize → jpeg → base64)
      const { base64, mimeType } = await preprocessImage(photo.uri);

      // 3) Analyze with Gemini
      const aiResult = await analyzeImageWithGemini(base64, mimeType);

      if (!aiResult) {
        setResult({
          itemsDetected: 0,
          compatible: false,
          recommendedProgram: "Unable to analyze",
          warning: "⚠️ Unable to analyze the image",
          conflictReason: null,
        });
        setIsProcessing(false);
        return;
      }

      // -----------------------------------------
      // 4) Compatibility rules (single item)
      // -----------------------------------------
      let incompatible = false;
      let conflictReason = null;

      const fabric = aiResult.fabric?.toLowerCase() || "";
      const temp = aiResult.recommended?.temp || 0;
      const spin = aiResult.recommended?.spin || 0;

      // Rule 1: Delicate fabrics
      if (fabric === "wool" || fabric === "delicate") {
        incompatible = true;
        conflictReason = `The fabric "${aiResult.fabric}" requires a separate wash.`;
      }

      // Rule 2: High temperature
      if (!incompatible && temp > 40) {
        incompatible = true;
        conflictReason = `Temperature ${temp}°C is too high for mixed loads.`;
      }

      // Rule 3: High spin
      if (!incompatible && spin > 1000) {
        incompatible = true;
        conflictReason = `${spin} rpm is too aggressive for delicate fabrics.`;
      }

      // -----------------------------------------
      // 5) Final Batch Result
      // -----------------------------------------
      const batchResult = {
        itemsDetected: 1, // single-item pipeline
        compatible: !incompatible,
        recommendedProgram: `${aiResult.recommended.program} ${aiResult.recommended.temp}°C`,
        warning: incompatible ? "⚠️ Incompatible item detected" : null,
        conflictReason: incompatible ? conflictReason : null,
      };

      setResult(batchResult);
    } catch (err) {
      console.log("BatchScan AI error:", err);
      setResult({
        itemsDetected: 0,
        compatible: false,
        recommendedProgram: "Error analyzing image",
        warning: "⚠️ Error during analysis",
        conflictReason: null,
      });
    }

    setIsProcessing(false);
  };

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
          <View style={{ flex: 1, borderRadius: 20, overflow: "hidden", margin: 20 }}>
            <CameraView
              ref={cameraRef}
              facing="back"
              style={{ flex: 1 }}
            />
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

            <Text style={{ color: "#fff", marginTop: 6 }}>
              Recommended Program: {result.recommendedProgram}
            </Text>

            {result.warning && (
              <Text style={{ color: "#ff6b6b", marginTop: 10, fontWeight: "700" }}>
                {result.warning}
              </Text>
            )}

            {result.conflictReason && (
              <Text style={{ color: "#ff9f9f", marginTop: 6 }}>
                {result.conflictReason}
              </Text>
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