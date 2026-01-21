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

export default function EditGarmentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { garment, onSave, onDelete } = route.params;

  // PRO fields
  const [name, setName] = useState(garment.name);
  const [type, setType] = useState(garment.type);
  const [color, setColor] = useState(garment.color ?? "");
  const [category, setCategory] = useState(garment.category ?? "");
  const [fabric, setFabric] = useState(garment.fabric ?? "");
  const [pattern, setPattern] = useState(garment.pattern ?? "");
  const [image, setImage] = useState<string | null>(garment.image);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });

    if (!res.canceled) {
      setImage(res.assets[0].uri);
    }
  };

  const handleSave = () => {
    const updated = {
      ...garment,
      name,
      type,
      color,
      category,
      fabric,
      pattern,
      image,
    };

    onSave(updated);
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Garment",
      "Are you sure you want to delete this item?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            onDelete(garment.id);
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
            <Text style={{ color: "#ff6b6b", fontSize: 16 }}>← Back</Text>
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
            Edit Garment
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
                <Text style={{ color: "#fff" }}>Tap to add image</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* NAME */}
          <Text style={{ color: "#fff", marginBottom: 6 }}>Name</Text>
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
          <Text style={{ color: "#fff", marginBottom: 6 }}>Type</Text>
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
          <Text style={{ color: "#fff", marginBottom: 6 }}>Color</Text>
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
          <Text style={{ color: "#fff", marginBottom: 6 }}>Category</Text>
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
          <Text style={{ color: "#fff", marginBottom: 6 }}>Fabric</Text>
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
          <Text style={{ color: "#fff", marginBottom: 6 }}>Pattern</Text>
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
              Save Changes
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
              Delete Garment
            </Text>
          </TouchableOpacity>

        </SafeAreaView>
      </ScrollView>
    </LinearGradient>
  );
}