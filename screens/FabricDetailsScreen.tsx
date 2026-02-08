import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    Text,
    TouchableOpacity
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import i18n from "../i18n";
import { useFabricsStore } from "../store/fabricsStore";
import { generateCareInstructionsPro } from "../utils/AI/AILaundryAssistant/aiFabricCarePro";

export default function FabricDetailsScreen({ route, navigation }: any) {
  const { fabricName } = route.params;

  const fabricsStore = useFabricsStore();
  const fabric = fabricsStore.fabrics.find(
    (f) => f.name.toLowerCase() === fabricName.toLowerCase()
  );

  const [loadingAI, setLoadingAI] = useState(false);
  const [careInstructions, setCareInstructions] = useState<string[]>(
    fabric?.careInstructions ?? []
  );

  const regenerateAI = async () => {
    setLoadingAI(true);
    try {
      const ai = await generateCareInstructionsPro(fabricName);

      setCareInstructions(ai.careInstructions);

      if (fabric) {
        fabricsStore.updateFabric({
          ...fabric,
          careInstructions: ai.careInstructions,
          fabricType: ai.fabricType,
          weave: ai.weave,
          sensitivity: ai.sensitivity,
          recommended: ai.recommended,
        });
      }
    } catch (err) {
      console.log("AI error:", err);
    }
    setLoadingAI(false);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={["#0f0c29", "#302b63", "#24243e"]}
        style={{ flex: 1, padding: 20 }}
      >
        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: "#fff", fontSize: 18 }}>
            ← {String(i18n.t("fabricDetails.back"))}
          </Text>
        </TouchableOpacity>

        {/* Title */}
        <Animated.Text
          entering={FadeInUp.duration(500)}
          style={{
            color: "#fff",
            fontSize: 34,
            fontWeight: "800",
            marginTop: 10,
            marginBottom: 20,
          }}
        >
          {fabricName}
        </Animated.Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          {/* IMAGE */}
          {fabric?.image && (
            <Animated.View
              entering={FadeInUp.delay(100)}
              style={{
                marginBottom: 20,
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              <Image
                source={{ uri: fabric.image }}
                style={{ width: "100%", height: 240 }}
              />
            </Animated.View>
          )}

          {/* FABRIC TYPE */}
          {fabric?.fabricType && (
            <Animated.View
              entering={FadeInUp.delay(120)}
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                padding: 18,
                borderRadius: 14,
                marginBottom: 20,
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
                {String(i18n.t("fabricDetails.fabricType"))}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 15 }}>
                {fabric.fabricType}
              </Text>
            </Animated.View>
          )}

          {/* WEAVE */}
          {fabric?.weave && (
            <Animated.View
              entering={FadeInUp.delay(150)}
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                padding: 18,
                borderRadius: 14,
                marginBottom: 20,
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
                {String(i18n.t("fabricDetails.weave"))}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 15 }}>
                {fabric.weave}
              </Text>
            </Animated.View>
          )}

          {/* SENSITIVITY */}
          {fabric?.sensitivity && (
            <Animated.View
              entering={FadeInUp.delay(180)}
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                padding: 18,
                borderRadius: 14,
                marginBottom: 20,
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
                {String(i18n.t("fabricDetails.sensitivity"))}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 15 }}>
                {fabric.sensitivity}
              </Text>
            </Animated.View>
          )}

          {/* RECOMMENDED PROGRAM */}
          {fabric?.recommended && (
            <Animated.View
              entering={FadeInUp.delay(210)}
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                padding: 18,
                borderRadius: 14,
                marginBottom: 20,
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
                {String(i18n.t("fabricDetails.recommendedProgram"))}
              </Text>

              <Text style={{ color: "#fff", marginBottom: 6 }}>
                {String(i18n.t("fabricDetails.program"))}: {fabric.recommended.program}
              </Text>
              <Text style={{ color: "#fff", marginBottom: 6 }}>
                {String(i18n.t("fabricDetails.temp"))}: {fabric.recommended.temp}°C
              </Text>
              <Text style={{ color: "#fff", marginBottom: 6 }}>
                {String(i18n.t("fabricDetails.spin"))}: {fabric.recommended.spin} rpm
              </Text>
            </Animated.View>
          )}

          {/* DESCRIPTION */}
          {fabric?.description && (
            <Animated.View
              entering={FadeInUp.delay(250)}
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                padding: 18,
                borderRadius: 14,
                marginBottom: 20,
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
                {String(i18n.t("fabricDetails.description"))}
              </Text>

              <Text
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: 15,
                  lineHeight: 22,
                }}
              >
                {fabric.description}
              </Text>
            </Animated.View>
          )}

          {/* CARE INSTRUCTIONS */}
          <Animated.View
            entering={FadeInUp.delay(300)}
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              padding: 18,
              borderRadius: 14,
              marginBottom: 20,
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
              {String(i18n.t("fabricDetails.careInstructions"))}
            </Text>

            {careInstructions.length > 0 ? (
              careInstructions.map((line, i) => (
                <Text
                  key={i}
                  style={{
                    color: "rgba(255,255,255,0.85)",
                    marginBottom: 6,
                    fontSize: 15,
                  }}
                >
                  • {line}
                </Text>
              ))
            ) : (
              <Text
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 15,
                }}
              >
                {String(i18n.t("fabricDetails.noCareInstructions"))}
              </Text>
            )}
          </Animated.View>

          {/* REGENERATE BUTTON */}
          <Animated.View entering={FadeInUp.delay(350)}>
            <TouchableOpacity
              onPress={regenerateAI}
              disabled={loadingAI}
              style={{
                backgroundColor: "#2575fc",
                padding: 16,
                borderRadius: 14,
                opacity: loadingAI ? 0.6 : 1,
              }}
            >
              {loadingAI ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{
                    color: "#fff",
                    textAlign: "center",
                    fontSize: 18,
                    fontWeight: "700",
                  }}
                >
                  {String(i18n.t("fabricDetails.regenerate"))}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}