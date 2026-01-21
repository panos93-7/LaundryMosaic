import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Animated,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFabricsStore } from "../store/fabricsStore";
import { analyzeFabricPro } from "../utils/aiFabricAnalyzerPro";
import { generateCareInstructionsPro } from "../utils/aiFabricCarePro";

export default function CustomFabricsScreen() {
  const navigation = useNavigation<any>();

  const fabrics = useFabricsStore((s) => s.fabrics);
  const hydrate = useFabricsStore((s) => s.hydrate);
  const addFabric = useFabricsStore((s) => s.addFabric);
  const updateFabric = useFabricsStore((s) => s.updateFabric);
  const deleteFabric = useFabricsStore((s) => s.deleteFabric);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [careInstructions, setCareInstructions] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);

  // FAB menu state
  const [fabOpen, setFabOpen] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(10))[0];

  useEffect(() => {
    hydrate();
  }, []);

  const openAddModal = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setCareInstructions([]);
    setModalVisible(true);
  };

  const openEditModal = (fabric: any) => {
    setEditing(fabric);
    setName(fabric.name);
    setDescription(fabric.description ?? "");
    setCareInstructions(fabric.careInstructions ?? []);
    setModalVisible(true);
  };

  const saveFabric = () => {
    if (editing) {
      updateFabric({
        ...editing,
        name,
        description,
        careInstructions,
      });
    } else {
      addFabric({
        id: Date.now(),
        name,
        description,
        careInstructions,
      });
    }
    setModalVisible(false);
  };

  const generateAI = async () => {
    if (!name.trim()) return;

    setLoadingAI(true);
    try {
      const ai = await generateCareInstructionsPro(name);
setCareInstructions(ai.careInstructions);
    } catch (err) {
      console.log("AI error:", err);
    }
    setLoadingAI(false);
  };

  // -----------------------------
  // 📸 SCAN FABRIC (AI)
  // -----------------------------
  const handleScanFabric = async () => {
    setFabOpen(false);

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      base64: true,
    });

    if (res.canceled) return;

    const base64 = res.assets[0].base64!;
    const uri = res.assets[0].uri;

    setLoadingAI(true);

    try {
      const ai = await analyzeFabricPro(base64);

      await addFabric({
        id: Date.now(),
        name: ai.fabricType ?? "Unknown Fabric",
        description: ai.weave ?? "",
        fabricType: ai.fabricType,
        weave: ai.weave,
        sensitivity: ai.sensitivity,
        recommended: ai.recommended,
        careInstructions: ai.careInstructions ?? [],
        image: uri,
      });
    } catch (err) {
      console.log("AI fabric error:", err);
    }

    setLoadingAI(false);
  };

  // -----------------------------
  // FAB MENU ANIMATION
  // -----------------------------
  const toggleFab = () => {
    const toValue = fabOpen ? 0 : 1;

    setFabOpen(!fabOpen);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: fabOpen ? 10 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
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
            Custom Fabrics
          </Text>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: "#ff6b6b", fontSize: 16 }}>Close</Text>
          </TouchableOpacity>
        </View>

        {/* EMPTY STATE */}
        {fabrics.length === 0 && (
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
              No custom fabrics yet
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
              Add your own fabrics or scan new ones with AI.
            </Text>
          </View>
        )}

        {/* LIST */}
        {fabrics.length > 0 && (
          <FlatList
            data={fabrics}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => openEditModal(item)}
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: "600",
                    marginBottom: 4,
                  }}
                >
                  {item.name}
                </Text>

                {item.description ? (
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      fontSize: 14,
                    }}
                  >
                    {item.description}
                  </Text>
                ) : null}
              </TouchableOpacity>
            )}
          />
        )}

        {/* ----------------------------- */}
        {/* FAB MENU */}
        {/* ----------------------------- */}
        <View
             style={{
             position: "absolute",
             bottom: 30,
             left: 0,
             right: 0,
             alignItems: "center",
         }}
            >
          {/* MENU ITEMS */}
          {fabOpen && (
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                marginBottom: 10,
              }}
            >
              <TouchableOpacity
                onPress={handleScanFabric}
                style={{
                  backgroundColor: "#2575fc",
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 16 }}>
                  📤 Upload Fabric (AI)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={openAddModal}
                style={{
                  backgroundColor: "#4CAF50",
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 16 }}>
                  ＋ Add Fabric
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* MAIN FAB */}
          <TouchableOpacity
            onPress={toggleFab}
            style={{
              backgroundColor: "#2575fc",
              width: 60,
              height: 60,
              borderRadius: 30,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 30 }}>
              {fabOpen ? "×" : "+"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* MODAL */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.6)",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <View
              style={{
                backgroundColor: "#1e1e2f",
                padding: 20,
                borderRadius: 14,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 20,
                  fontWeight: "700",
                  marginBottom: 16,
                }}
              >
                {editing ? "Edit Fabric" : "Add Fabric"}
              </Text>

              {/* NAME */}
              <TextInput
                placeholder="Fabric name"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={name}
                onChangeText={setName}
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  padding: 12,
                  borderRadius: 10,
                  marginBottom: 12,
                }}
              />

              {/* DESCRIPTION */}
              <TextInput
                placeholder="Description (optional)"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={description}
                onChangeText={setDescription}
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  padding: 12,
                  borderRadius: 10,
                  marginBottom: 20,
                }}
              />

              {/* CARE INSTRUCTIONS */}
              <Text style={{ color: "#fff", marginBottom: 6 }}>
                Care Instructions
              </Text>

              {careInstructions.length > 0 ? (
                careInstructions.map((line, i) => (
                  <Text
                    key={i}
                    style={{
                      color: "rgba(255,255,255,0.8)",
                      marginBottom: 4,
                      fontSize: 14,
                    }}
                  >
                    • {line}
                  </Text>
                ))
              ) : (
                <Text
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    marginBottom: 10,
                  }}
                >
                  No care instructions yet
                </Text>
              )}

              {/* GENERATE WITH AI */}
              <TouchableOpacity
                onPress={generateAI}
                disabled={loadingAI}
                style={{
                  backgroundColor: "#2575fc",
                  padding: 12,
                  borderRadius: 10,
                  marginBottom: 20,
                  opacity: loadingAI ? 0.6 : 1,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    textAlign: "center",
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  {loadingAI ? "Generating…" : "Generate with AI"}
                </Text>
              </TouchableOpacity>

              {/* SAVE */}
              <TouchableOpacity
                onPress={saveFabric}
                style={{
                  backgroundColor: "#4CAF50",
                  padding: 14,
                  borderRadius: 12,
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    textAlign: "center",
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Save
                </Text>
              </TouchableOpacity>

              {/* DELETE */}
              {editing && (
                <TouchableOpacity
                  onPress={() => {
                    deleteFabric(editing.id);
                    setModalVisible(false);
                  }}
                  style={{
                    backgroundColor: "#ff6b6b",
                    padding: 14,
                    borderRadius: 12,
                    marginBottom: 10,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      textAlign: "center",
                      fontSize: 16,
                      fontWeight: "600",
                    }}
                  >
                    Delete
                  </Text>
                </TouchableOpacity>
              )}

              {/* CANCEL */}
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{
                  padding: 14,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    textAlign: "center",
                    fontSize: 16,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </LinearGradient>
  );
}