import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import i18n from "../i18n";

export default function GarmentDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { garment, onSave, onDelete } = route.params;

  const handleDelete = () => {
    onDelete(garment.id);
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
            {garment.name}
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
            {String(i18n.t("garmentDetails.type"))}: {garment.type}
          </Text>

          <Text style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}>
            {String(i18n.t("garmentDetails.color"))}: {garment.color ?? String(i18n.t("garmentDetails.unknown"))}
          </Text>

          <Text style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}>
            {String(i18n.t("garmentDetails.fabric"))}: {garment.fabric ?? String(i18n.t("garmentDetails.unknown"))}
          </Text>

          <Text style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}>
            {String(i18n.t("garmentDetails.pattern"))}: {garment.pattern ?? String(i18n.t("garmentDetails.none"))}
          </Text>

          <Text style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}>
            {String(i18n.t("garmentDetails.category"))}: {garment.category ?? String(i18n.t("garmentDetails.uncategorized"))}
          </Text>

          {/* STAINS */}
          {garment.stains && garment.stains.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <Text style={{ color: "#ff9f9f", fontSize: 18, fontWeight: "600" }}>
                {String(i18n.t("garmentDetails.stainsDetected"))}
              </Text>

              {garment.stains.map((s: string, i: number) => (
                <Text key={i} style={{ color: "#fff", marginTop: 4 }}>
                  • {s}
                </Text>
              ))}
            </View>
          )}

          {/* CARE INSTRUCTIONS */}
          {garment.care && (
            <View style={{ marginTop: 20 }}>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
                {String(i18n.t("garmentDetails.careInstructions"))}
              </Text>

              <Text style={{ color: "#fff", marginTop: 6 }}>
                {garment.care.instructions}
              </Text>

              <Text style={{ color: "#fff", marginTop: 6 }}>
                {String(i18n.t("garmentDetails.recommendedTemp"))}: {garment.care.temp}°C
              </Text>

              <Text style={{ color: "#fff", marginTop: 6 }}>
                {String(i18n.t("garmentDetails.spinSpeed"))}: {garment.care.spin} rpm
              </Text>
            </View>
          )}

          {/* RECOMMENDED WASH PROGRAM */}
          {garment.recommended && (
            <View style={{ marginTop: 20 }}>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
                {String(i18n.t("garmentDetails.recommendedWashProgram"))}
              </Text>

              <Text style={{ color: "#fff", marginTop: 6 }}>
                {String(i18n.t("garmentDetails.program"))}: {garment.recommended.program}
              </Text>

              <Text style={{ color: "#fff", marginTop: 6 }}>
                {String(i18n.t("garmentDetails.temp"))}: {garment.recommended.temp}°C
              </Text>

              <Text style={{ color: "#fff", marginTop: 6 }}>
                {String(i18n.t("garmentDetails.spin"))}: {garment.recommended.spin} rpm
              </Text>
            </View>
          )}

          {/* EDIT BUTTON */}
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("EditGarment", {
                garment,
                onSave,
                onDelete,
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