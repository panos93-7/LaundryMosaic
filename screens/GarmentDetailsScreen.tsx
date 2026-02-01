import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import i18n from "../i18n";

import { useWardrobeStore } from "../store/wardrobeStore";
import { translateGarmentProfile } from "../utils/AI/translateGarment";
import { translationCache } from "../utils/AI/translationCache";

export default function GarmentDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // We now receive ONLY the ID
  const { id } = route.params;

  // Pull garment reactively from the store
  const garment = useWardrobeStore((s) =>
    s.garments.find((g) => g.id === id)
  );

  const deleteGarment = useWardrobeStore((s) => s.deleteGarment);

  const locale = (i18n as any).language;

  // Local state for translated profile
  const [profile, setProfile] = useState(garment?.profile);

  // If garment is missing (deleted), show fallback
  if (!garment) {
    return (
      <LinearGradient
        colors={["#0f0c29", "#302b63", "#24243e"]}
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Text style={{ color: "#fff" }}>Garment not found.</Text>
      </LinearGradient>
    );
  }

  // Auto-translate on language change OR when garment changes
  useEffect(() => {
    async function load() {
      if (!garment) return;

      if (locale === "en") {
        setProfile(garment.original);
        return;
      }

      const translated = await translateGarmentProfile(
        garment.original,
        locale,
        garment.id.toString(),
        translationCache
      );

      setProfile(translated);
    }

    load();
  }, [locale, garment?.id]);

  const handleDelete = () => {
    deleteGarment(garment.id);
    navigation.goBack();
  };

  return (
    <LinearGradient
      colors={["#0f0c29", "#302b63", "#24243e"]}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView>

          {/* BACK */}
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: "#ff6b6b", fontSize: 16 }}>
              ← {String(i18n.t("garmentDetails.back"))}
            </Text>
          </TouchableOpacity>

          {/* TITLE */}
          <Text
            style={{
              color: "#fff",
              fontSize: 28,
              fontWeight: "700",
              marginBottom: 20,
            }}
          >
            {profile?.name}
          </Text>

          {/* IMAGE */}
          {garment.image ? (
            <Image
              source={{ uri: garment.image }}
              style={{
                width: "100%",
                height: 260,
                borderRadius: 14,
                marginBottom: 20,
              }}
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: 260,
                borderRadius: 14,
                backgroundColor: "rgba(255,255,255,0.1)",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text style={{ color: "#fff" }}>
                {String(i18n.t("garmentDetails.noImage"))}
              </Text>
            </View>
          )}

          {/* BASIC INFO */}
          <Text style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}>
            {String(i18n.t("garmentDetails.type"))}: {profile?.type}
          </Text>

          <Text style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}>
            {String(i18n.t("garmentDetails.color"))}: {profile?.color}
          </Text>

          <Text style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}>
            {String(i18n.t("garmentDetails.fabric"))}: {profile?.fabric}
          </Text>

          <Text style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}>
            {String(i18n.t("garmentDetails.pattern"))}: {profile?.pattern}
          </Text>

          <Text style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}>
            {String(i18n.t("garmentDetails.category"))}: {profile?.category}
          </Text>

          {/* STAINS */}
          {(profile?.stains?.length ?? 0) > 0 && (
  <View style={{ marginTop: 20 }}>
    <Text style={{ color: "#ff9f9f", fontSize: 18, fontWeight: "600" }}>
      {String(i18n.t("garmentDetails.stainsDetected"))}
    </Text>

    {profile?.stains?.map((s, i) => (
      <Text key={i} style={{ color: "#fff", marginTop: 4 }}>
        • {s}
      </Text>
    ))}
  </View>
)}

          {/* RECOMMENDED PROGRAM */}
          {profile?.recommended && (
            <View style={{ marginTop: 30 }}>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
                {String(i18n.t("garmentDetails.recommendedWashProgram"))}
              </Text>

              <Text style={{ color: "#fff", marginTop: 6 }}>
                {String(i18n.t("garmentDetails.program"))}: {profile.recommended.program}
              </Text>

              <Text style={{ color: "#fff", marginTop: 6 }}>
                {String(i18n.t("garmentDetails.temp"))}: {profile.recommended.temp}°C
              </Text>

              <Text style={{ color: "#fff", marginTop: 6 }}>
                {String(i18n.t("garmentDetails.spin"))}: {profile.recommended.spin} rpm
              </Text>

              <Text style={{ color: "#fff", marginTop: 6 }}>
                {String(i18n.t("garmentDetails.detergent"))}: {profile.recommended.detergent}
              </Text>

              {profile.recommended.notes?.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    {String(i18n.t("garmentDetails.notes"))}:
                  </Text>
                  {profile.recommended.notes.map((n: string, i: number) => (
                    <Text key={i} style={{ color: "#fff", marginTop: 4 }}>
                      • {n}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* CARE INSTRUCTIONS */}
          {profile?.care && (
            <View style={{ marginTop: 30 }}>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
                {String(i18n.t("garmentDetails.careInstructions"))}
              </Text>

              <Text style={{ color: "#fff", marginTop: 6 }}>{profile.care.wash}</Text>
              <Text style={{ color: "#fff", marginTop: 6 }}>{profile.care.bleach}</Text>
              <Text style={{ color: "#fff", marginTop: 6 }}>{profile.care.dry}</Text>
              <Text style={{ color: "#fff", marginTop: 6 }}>{profile.care.iron}</Text>
              <Text style={{ color: "#fff", marginTop: 6 }}>{profile.care.dryclean}</Text>

              {profile.care.warnings?.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    {String(i18n.t("care.warnings"))}:
                  </Text>
                  {profile.care.warnings.map((w: string, i: number) => (
                    <Text key={i} style={{ color: "#fff", marginTop: 4 }}>
                      • {w}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

{/* RISKS */}
{profile?.risks && (
  <View style={{ marginTop: 30 }}>
    <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
      {String(i18n.t("garmentDetails.risks"))}
    </Text>

    <Text style={{ color: "#fff", marginTop: 6 }}>
      {String(i18n.t("garmentDetails.riskShrinkage"))}: {profile.risks.shrinkage}
    </Text>

    <Text style={{ color: "#fff", marginTop: 6 }}>
      {String(i18n.t("garmentDetails.riskColorBleeding"))}: {profile.risks.colorBleeding}
    </Text>

    <Text style={{ color: "#fff", marginTop: 6 }}>
      {String(i18n.t("garmentDetails.riskDelicacy"))}: {profile.risks.delicacy}
    </Text>
  </View>
)}

          {/* WASH FREQUENCY */}
          {profile?.washFrequency && (
            <View style={{ marginTop: 30 }}>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
                {String(i18n.t("garmentDetails.washFrequency"))}
              </Text>

              <Text style={{ color: "#fff", marginTop: 6 }}>
                {profile.washFrequency}
              </Text>
            </View>
          )}

          {/* CARE SYMBOLS */}
          {(profile?.careSymbols?.length ?? 0) > 0 && (
  <View style={{ marginTop: 30 }}>
    <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
      {String(i18n.t("garmentDetails.careSymbols"))}
    </Text>

    {profile?.careSymbols?.map((sym, i) => (
      <Text key={i} style={{ color: "#fff", marginTop: 4 }}>
        • {sym}
      </Text>
    ))}
  </View>
)}

          {/* EDIT BUTTON */}
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("EditGarment", {
                id: garment.id,
              })
            }
            style={{
              backgroundColor: "#2575fc",
              padding: 14,
              borderRadius: 12,
              marginTop: 30,
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
              {String(i18n.t("garmentDetails.editGarment"))}
            </Text>
          </TouchableOpacity>

          {/* DELETE BUTTON */}
          <TouchableOpacity
            onPress={handleDelete}
            style={{
              backgroundColor: "#ff6b6b",
              padding: 14,
              borderRadius: 12,
              marginTop: 14,
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
              {String(i18n.t("garmentDetails.deleteGarment"))}
            </Text>
          </TouchableOpacity>

        </SafeAreaView>
      </ScrollView>
    </LinearGradient>
  );
}