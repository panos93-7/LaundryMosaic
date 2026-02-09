import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import i18n from "../i18n";
import { useWardrobeStore } from "../store/wardrobeStore";

export default function EditGarmentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { id } = route.params;

  const garment = useWardrobeStore((s) =>
    s.garments.find((g) => g.id === id)
  );

  const updateGarment = useWardrobeStore((s) => s.updateGarment);
  const deleteGarment = useWardrobeStore((s) => s.deleteGarment);

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

// Editable fields come from garment.profile
const [name, setName] = useState(garment.profile.name);
const [type, setType] = useState(garment.profile.type);
const [color, setColor] = useState(garment.profile.color ?? "");
const [category, setCategory] = useState(garment.profile.category ?? "");
const [fabric, setFabric] = useState(garment.profile.fabric ?? "");
const [pattern, setPattern] = useState(garment.profile.pattern ?? "");
const [image, setImage] = useState<string | null>(garment?.image ?? null);

const pickImage = async () => {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.9,
  });

  if (!res.canceled) {
    setImage(res.assets[0].uri);
  }
};

// ⭐ SmartWardrobe V3 aligned save
const handleSave = () => {
  // 1) Updated canonical (always EN)
  const updatedOriginal = {
    ...garment.original,
    name,
    type,
    color,
    category,
    fabric,
    pattern,
  };

  // 2) Updated profile (UI preview only)
  const updatedProfile = {
    ...garment.profile,
    name,
    type,
    color,
    category,
    fabric,
    pattern,
  };

  // ⭐ 3) Make profile SAFE (no undefined fields)
  const safeProfile = {
    ...updatedProfile,
    careSymbolLabels: updatedProfile.careSymbolLabels ?? {},
    __locale: updatedProfile.__locale ?? garment.profile.__locale ?? "en",
  };

  // ⭐ 4) Save garment
  updateGarment({
    id: garment.id,
    original: updatedOriginal,
    profile: safeProfile,
    image: image ?? garment.image,
  });

  navigation.goBack();
};

const handleDelete = () => {
  Alert.alert(
    String(i18n.t("editGarment.alertTitle")),
    String(i18n.t("editGarment.alertMessage")),
    [
      { text: String(i18n.t("editGarment.cancel")), style: "cancel" },
      {
        text: String(i18n.t("editGarment.delete")),
        style: "destructive",
        onPress: () => {
          deleteGarment(garment.id);
          navigation.goBack();
        },
      },
    ]
  );
};
    return (
    <LinearGradient
      colors={["#0f0c29", "#302b63", "#24243e"]}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView>
          {/* BACK */}
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: "#ff6b6b", fontSize: 16 }}>
              ← {String(i18n.t("editGarment.back"))}
            </Text>
          </TouchableOpacity>

          <Text
            style={{
              color: "#fff",
              fontSize: 28,
              fontWeight: "700",
              flexShrink: 1,
              marginRight: 10,
            }}
            numberOfLines={2}
          >
            {String(i18n.t("editGarment.title"))}
          </Text>

          {/* IMAGE PICKER */}
          <TouchableOpacity onPress={pickImage}>
            {image ? (
              <Image
                source={{ uri: image }}
                style={{
                  width: "100%",
                  height: 240,
                  borderRadius: 14,
                  marginBottom: 20,
                }}
              />
            ) : (
              <View
                style={{
                  width: "100%",
                  height: 240,
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Text style={{ color: "#fff" }}>
                  {String(i18n.t("editGarment.tapToAddImage"))}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* NAME */}
          <Text style={{ color: "#fff", marginBottom: 6 }}>
            {String(i18n.t("editGarment.name"))}
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              color: "#fff",
              padding: 12,
              borderRadius: 10,
              marginBottom: 16,
            }}
          />

          {/* TYPE */}
          <Text style={{ color: "#fff", marginBottom: 6 }}>
            {String(i18n.t("editGarment.type"))}
          </Text>
          <TextInput
            value={type}
            onChangeText={setType}
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              color: "#fff",
              padding: 12,
              borderRadius: 10,
              marginBottom: 16,
            }}
          />

          {/* COLOR */}
          <Text style={{ color: "#fff", marginBottom: 6 }}>
            {String(i18n.t("editGarment.color"))}
          </Text>
          <TextInput
            value={color}
            onChangeText={setColor}
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              color: "#fff",
              padding: 12,
              borderRadius: 10,
              marginBottom: 16,
            }}
          />

          {/* CATEGORY */}
          <Text style={{ color: "#fff", marginBottom: 6 }}>
            {String(i18n.t("editGarment.category"))}
          </Text>
          <TextInput
            value={category}
            onChangeText={setCategory}
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              color: "#fff",
              padding: 12,
              borderRadius: 10,
              marginBottom: 16,
            }}
          />

          {/* FABRIC */}
          <Text style={{ color: "#fff", marginBottom: 6 }}>
            {String(i18n.t("editGarment.fabric"))}
          </Text>
          <TextInput
            value={fabric}
            onChangeText={setFabric}
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              color: "#fff",
              padding: 12,
              borderRadius: 10,
              marginBottom: 16,
            }}
          />

          {/* PATTERN */}
          <Text style={{ color: "#fff", marginBottom: 6 }}>
            {String(i18n.t("editGarment.pattern"))}
          </Text>
          <TextInput
            value={pattern}
            onChangeText={setPattern}
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              color: "#fff",
              padding: 12,
              borderRadius: 10,
              marginBottom: 16,
            }}
          />

          {/* SAVE */}
          <TouchableOpacity
            onPress={handleSave}
            style={{
              backgroundColor: "#4CAF50",
              padding: 14,
              borderRadius: 12,
              marginTop: 10,
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
              {String(i18n.t("editGarment.saveChanges"))}
            </Text>
          </TouchableOpacity>

          {/* DELETE */}
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
              {String(i18n.t("editGarment.deleteGarment"))}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ScrollView>
    </LinearGradient>
  );
}