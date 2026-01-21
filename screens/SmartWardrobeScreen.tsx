import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GarmentCard } from "../components/GarmentCard";
import { useWardrobeStore } from "../store/wardrobeStore";
import { analyzeGarmentPro } from "../utils/aiGarmentAnalyzerPro";


export default function WardrobeScreen() {
  const navigation = useNavigation<any>();

  const garments = useWardrobeStore((s) => s.garments);
  const addGarment = useWardrobeStore((s) => s.addGarment);
  const updateGarment = useWardrobeStore((s) => s.updateGarment);
  const deleteGarment = useWardrobeStore((s) => s.deleteGarment);
  const hydrate = useWardrobeStore((s) => s.hydrate);

  const [analyzing, setAnalyzing] = useState(false);

  // Load wardrobe on mount
  useEffect(() => {
    hydrate();
  }, []);

  const handleAddGarment = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      base64: true,
    });

    if (res.canceled) return;

    const base64 = res.assets[0].base64!;
    const uri = res.assets[0].uri;

    setAnalyzing(true);

    try {
      const ai = await analyzeGarmentPro(base64);

      await addGarment({
  id: Date.now(),
  name: ai.name,
  type: ai.type,
  category: ai.category,
  fabric: ai.fabric,
  color: ai.color,
  pattern: ai.pattern,
  stains: ai.stains,
  recommended: ai.recommended,
  care: {
    instructions: `${ai.recommended.temp}°C • ${ai.recommended.spin} rpm`,
    temp: ai.recommended.temp,
    spin: ai.recommended.spin,
  },
  image: uri,
});
    } catch (err) {
      console.log("AI error:", err);
    }

    setAnalyzing(false);
  };

  return (
    <LinearGradient
      colors={["#0f0c29", "#302b63", "#24243e"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1, padding: 20 }}>

        {/* HEADER */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 28,
              fontWeight: "700",
            }}
          >
            Smart Wardrobe
          </Text>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: "#ff6b6b", fontSize: 16 }}>Close</Text>
          </TouchableOpacity>
        </View>

        {/* AI LOADING */}
        {analyzing && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: "#fff", fontSize: 18 }}>
              Analyzing garment…
            </Text>
          </View>
        )}

{/* EMPTY STATE */}
{garments.length === 0 && !analyzing && (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    }}
  >
    <Text
      style={{
        color: "rgba(255,255,255,0.9)",
        fontSize: 20,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 10,
      }}
    >
      Your wardrobe is empty
    </Text>

    <Text
      style={{
        color: "rgba(255,255,255,0.6)",
        fontSize: 16,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 30,
      }}
    >
      Add garments to start organizing your wardrobe and get AI-powered
      outfit recommendations.
    </Text>

    {/* ADD BUTTON BELOW TEXT */}
    <TouchableOpacity
      onPress={handleAddGarment}
      style={{
        backgroundColor: "#2575fc",
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
        marginTop: 10, // small breathing space
      }}
    >
      <Text style={{ color: "#fff", fontSize: 34, fontWeight: "700" }}>+</Text>
    </TouchableOpacity>
  </View>
)}

{/* GRID VIEW */}
{garments.length > 0 && (
  <>
    <FlatList
      data={garments}
      numColumns={2}
      keyExtractor={(item) => item.id.toString()}
      columnWrapperStyle={{ justifyContent: "space-between" }}
      renderItem={({ item }) => (
        <GarmentCard
          item={item}
          onPress={() =>
            navigation.navigate("GarmentDetails", {
              garment: item,
              onSave: updateGarment,
              onDelete: deleteGarment,
            })
          }
        />
      )}
    />

    {/* FLOATING BUTTON BOTTOM RIGHT */}
    <TouchableOpacity
      onPress={handleAddGarment}
      style={{
        position: "absolute",
        bottom: 30,
        right: 30,
        backgroundColor: "#2575fc",
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#fff", fontSize: 30 }}>+</Text>
    </TouchableOpacity>
  </>
)}
      </SafeAreaView>
    </LinearGradient>
  );
}