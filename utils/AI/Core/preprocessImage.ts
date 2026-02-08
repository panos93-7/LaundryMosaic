import * as ImageManipulator from "expo-image-manipulator";

export async function preprocessImage(
  uri: string
): Promise<{ base64: string; mimeType: string }> {
  try {
    if (!uri || typeof uri !== "string") {
      throw new Error("Invalid image URI");
    }

    const normalizedUri = uri.trim();

    const manipulated = await ImageManipulator.manipulateAsync(
      normalizedUri,
      [{ resize: { width: 1024 } }],
      {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    if (!manipulated?.base64) {
      console.log("❌ ImageManipulator returned no base64");
      return { base64: "", mimeType: "image/jpeg" };
    }

    const cleanedBase64 = manipulated.base64
      .replace(/^data:.*;base64,/, "")
      .trim();

    if (!cleanedBase64 || cleanedBase64.length < 200) {
      console.log("⚠️ Base64 unusually small:", cleanedBase64.length);
      // αλλά ΔΕΝ κάνουμε throw
    }

    return {
      base64: cleanedBase64,
      mimeType: "image/jpeg",
    };
  } catch (err) {
    console.log("❌ preprocessImage failed:", err);
    return { base64: "", mimeType: "image/jpeg" }; // fallback
  }
}