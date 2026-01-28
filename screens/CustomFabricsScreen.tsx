import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import i18n from "../i18n";
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

  const [statusMessage, setStatusMessage] = useState("");

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
    setStatusMessage(
      editing
        ? String(i18n.t("customFabrics.statusUpdating"))
        : String(i18n.t("customFabrics.statusAdding"))
    );

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
    setStatusMessage("");
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

  const handleScanFabric = async () => {
    setFabOpen(false);
    setStatusMessage(String(i18n.t("customFabrics.statusUploading")));

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      base64: true,
    });

    if (res.canceled) {
      setStatusMessage("");
      return;
    }

    const base64 = res.assets[0].base64!;
    const uri = res.assets[0].uri;

    setLoadingAI(true);

    try {
      const ai = await analyzeFabricPro(base64);

      await addFabric({
        id: Date.now(),
        name: ai.fabricType ?? String(i18n.t("customFabrics.unknownFabric")),
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
    setStatusMessage("");
  };

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
    marginBottom: 10,
  }}
>
  {/* LEFT SIDE: Title + Status */}
  <View style={{ flexShrink: 1, marginRight: 10 }}>
    <Text
      style={{
        color: "#fff",
        fontSize: 28,
        fontWeight: "700",
      }}
      numberOfLines={2}
    >
      {String(i18n.t("customFabrics.title"))}
    </Text>

    {statusMessage !== "" && (
      <Text
        style={{
          color: "rgba(255,255,255,0.8)",
          fontSize: 16,
          marginTop: 4,
        }}
      >
        {statusMessage}
      </Text>
    )}
  </View>

  {/* CLOSE BUTTON */}
  <TouchableOpacity onPress={() => navigation.goBack()}>
    <Text style={{ color: "#ff6b6b", fontSize: 16 }}>
      {String(i18n.t("customFabrics.close"))}
    </Text>
  </TouchableOpacity>
</View>

        {/* EMPTY STATE */}
        {fabrics.length === 0 && (
          <View
            style={{
              alignItems: "center",
              paddingHorizontal: 20,
              marginTop: 80,
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
              {String(i18n.t("customFabrics.emptyTitle"))}
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
              {String(i18n.t("customFabrics.emptySubtitle"))}
            </Text>

            {/* Centered (+) */}
            <TouchableOpacity
              onPress={toggleFab}
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                backgroundColor: "#2575fc",
                justifyContent: "center",
                alignItems: "center",
                marginTop: 10,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 36, fontWeight: "700" }}>
                {fabOpen ? "×" : "+"}
              </Text>
            </TouchableOpacity>

            {/* FAB MENU (EMPTY STATE) */}
            {fabOpen && (
              <Animated.View
                style={{
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                  marginTop: 15,
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
                    {String(i18n.t("customFabrics.uploadFabric"))}
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
                    {String(i18n.t("customFabrics.addFabric"))}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
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
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                {/* Thumbnail */}
                {item.image ? (
                  <View
                    style={{
                      width: 55,
                      height: 55,
                      borderRadius: 10,
                      overflow: "hidden",
                      backgroundColor: "rgba(255,255,255,0.1)",
                    }}
                  >
                    <Image
                      source={{ uri: item.image }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <View
                    style={{
                      width: 55,
                      height: 55,
                      borderRadius: 10,
                      backgroundColor: "rgba(255,255,255,0.08)",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        fontSize: 12,
                      }}
                    >
                      {String(i18n.t("customFabrics.noImage"))}
                    </Text>
                  </View>
                )}

                {/* Text */}
                <View style={{ flex: 1 }}>
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
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {/* FAB MENU (BOTTOM RIGHT WHEN LIST EXISTS) */}
        {fabrics.length > 0 && (
          <View
            style={{
              position: "absolute",
              bottom: 30,
              right: 30,
              alignItems: "center",
            }}
          >
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
                    {String(i18n.t("customFabrics.uploadFabric"))}
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
                    {String(i18n.t("customFabrics.addFabric"))}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}

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
        )}

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
                {editing
                  ? String(i18n.t("customFabrics.editFabric"))
                  : String(i18n.t("customFabrics.addFabricModal"))}
              </Text>

              {/* NAME */}
              <TextInput
                placeholder={String(i18n.t("customFabrics.fabricName"))}
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
                placeholder={String(
                  i18n.t("customFabrics.descriptionOptional")
                )}
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
                {String(i18n.t("customFabrics.careInstructions"))}
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
                  {String(i18n.t("customFabrics.noCareInstructions"))}
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
                  {loadingAI
                    ? String(i18n.t("customFabrics.generating"))
                    : String(i18n.t("customFabrics.generateWithAI"))}
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
                  {String(i18n.t("customFabrics.save"))}
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
                    {String(i18n.t("customFabrics.delete"))}
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
                  {String(i18n.t("customFabrics.cancel"))}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}