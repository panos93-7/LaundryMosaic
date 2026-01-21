import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInUp, Layout } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Events } from "../analytics/events";
import { analyzeImageWithGemini } from "../services/analyzeImage";
import { useFabricsStore } from "../store/fabricsStore";
import { useScanStore } from "../store/scanStore";
import { useUserStore } from "../store/userStore";
import { preprocessImage } from "../utils/AI/preprocessImage";
import { generateStainRemovalTips } from "../utils/aiStainRemoval";

export default function SmartScanScreen({ navigation }: any) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const setScanResult = useScanStore((s) => s.setScanResult);

  const isPremiumAnnual = useUserStore((s) => s.isPremiumAnnual);
  const isPro = useUserStore((s) => s.isPro);
  const userTier = useUserStore((s) => s.userTier);

  const fabricsStore = useFabricsStore();

  useEffect(() => {
    (async () => {
      await ImagePicker.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);

  // -----------------------------------------------------
  // PICK FROM GALLERY
  // -----------------------------------------------------
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

  // -----------------------------------------------------
  // TAKE PHOTO
  // -----------------------------------------------------
  const takePhoto = async () => {
    resetState();
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.9,
    });

    if (!res.canceled) {
      setImage(res.assets[0].uri);
      Events.aiScanStarted("camera");
      analyze(res.assets[0].uri);
    }
  };

  const resetState = () => {
    setImage(null);
    setResult(null);
    setError(null);
    setLoading(false);
  };
  const takeAnotherPhoto = () => {
  setResult(null);
  setError(null);
  setLoading(false);
  setImage(null);
  takePhoto(); // ανοίγει ξανά την κάμερα
};

  // -----------------------------------------------------
  // ANALYZE (pipeline)
  // -----------------------------------------------------
  const analyze = async (uri: string) => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // 1) Preprocess (crop + enhance)
      const { base64, mimeType } = await preprocessImage(uri);

      // 2) Send to Gemini
      const aiResult = await analyzeImageWithGemini(base64, mimeType);

      if (!aiResult) {
        setError("AI could not analyze the image.");
        setLoading(false);
        return;
      }

      // 4) Generate stain removal tips (one block per stain)
      let stainTips: any[] = [];

      if (aiResult.stains && aiResult.stains.length > 0) {
        for (const stain of aiResult.stains) {
          try {
            const tips = await generateStainRemovalTips(stain, aiResult.fabric);
            stainTips.push(tips);
          } catch (err) {
            console.log("Stain AI error:", err);
          }
        }
      }

      // 5) Final enriched result
      const enriched = {
        ...aiResult,
        stainTips,
      };

      setResult(enriched);
    } catch (err) {
      setError("AI could not analyze the image.");
    }

    setLoading(false);
  };

  const applyToMachine = () => {
    if (!result) return;

    if (!isPremiumAnnual && !isPro) {
  navigation.navigate("PremiumMonthlyPaywall", { source: "autoAdd" });
  return;
}

    Events.featureUnlockedUsed("ai_smart_scan", userTier);
    setScanResult(result);
    navigation.navigate("Home");
  };

  const handleAutoAdd = () => {
    if (!result) return;

    if (!isPremiumAnnual && !isPro) {
  navigation.navigate("PremiumMonthlyPaywall", { source: "autoAdd" });
  return;
}

    navigation.navigate("Planner", {
      autoAdd: {
        title: result.fabric || "Laundry Item",
        type: result.fabric || "General",
        time: "Any time",
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={["#0f0c29", "#302b63", "#24243e"]}
        style={{ flex: 1, padding: 20 }}
      >
        {/* Back Button */}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: "#fff", fontSize: 18 }}>← Back</Text>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 28,
            fontWeight: "800",
            color: "#fff",
            marginBottom: 20,
            marginTop: 10,
          }}
        >
          AI Smart Scan
        </Text>

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
                📸 Take Photo
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
                🖼️ Choose from Gallery
              </Text>
            </TouchableOpacity>
          </>
        )}

        {image && (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ alignItems: "center", marginTop: 20 }}>
              <Image
                source={{ uri: image }}
                style={{
                  width: 260,
                  height: 260,
                  borderRadius: 14,
                  marginBottom: 20,
                }}
              />

              {loading && (
                <ActivityIndicator size="large" color="#fff" style={{ marginTop: 10 }} />
              )}

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
    <Text style={{ color: "#ff6b6b", fontSize: 18, marginBottom: 10 }}>
      ❌ AI Scan Failed
    </Text>

    <Text style={{ color: "#fff", fontSize: 16, marginBottom: 20 }}>
      The AI could not analyze the image. Try again with a clearer photo.
    </Text>

    {/* RETRY SCAN */}
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
        Retry Scan
      </Text>
    </TouchableOpacity>

    {/* TAKE ANOTHER PHOTO */}
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
        Take Another Photo
      </Text>
    </TouchableOpacity>
  </View>
)}

              {result && !loading && !error && (
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
                    🧵 Fabric: {result.fabric}
                  </Animated.Text>

                  {/* COLOR */}
                  <Animated.Text
                    entering={FadeIn.delay(200)}
                    style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}
                  >
                    🎨 Color: {result.color}
                  </Animated.Text>

                  {/* STAINS */}
                  <Animated.Text
                    entering={FadeIn.delay(300)}
                    style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}
                  >
                    🧽 Stains: {result.stains.join(", ") || "None detected"}
                  </Animated.Text>

                  {/* RECOMMENDED PROGRAM */}
                  <Animated.Text
                    entering={FadeIn.delay(400)}
                    style={{ color: "#fff", fontSize: 18 }}
                  >
                    ⭐ Recommended Program: {result.recommended.program} (
                    {result.recommended.temp ?? "?"}°C / {result.recommended.spin ?? "?"} rpm)
                  </Animated.Text>

                  {/* CARE INSTRUCTIONS */}
                  {result.careInstructions?.length > 0 && (
                    <View style={{ marginTop: 20 }}>
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 18,
                          fontWeight: "700",
                          marginBottom: 10,
                        }}
                      >
                        🧼 Care Instructions
                      </Text>

                      {result.careInstructions.map((line: string, i: number) => (
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

                  {/* STAIN REMOVAL TIPS */}
                  {result.stainTips?.length > 0 && (
                    <View style={{ marginTop: 25 }}>
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 18,
                          fontWeight: "700",
                          marginBottom: 10,
                        }}
                      >
                        🧴 Stain Removal Tips
                      </Text>

                      {result.stainTips.map((tip: any, i: number) => (
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
                            {tip.stain}
                          </Text>

                          {tip.steps.map((step: string, idx: number) => (
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
                      ))}
                    </View>
                  )}
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
    Take Another Photo
  </Text>
</TouchableOpacity>

                  {/* APPLY TO MACHINE */}
                  <Animated.View entering={FadeIn.delay(500)}>
                    <TouchableOpacity
                      onPress={applyToMachine}
                      style={{
                        marginTop: 20,
                        backgroundColor: "#4CAF50",
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
                        Apply to Machine
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>

                  {/* AUTO ADD TO PLANNER */}
                  <Animated.View entering={FadeIn.delay(600)}>
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
                        Add to Planner automatically
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                </Animated.View>
              )}
            </View>
          </ScrollView>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}