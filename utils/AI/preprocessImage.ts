import * as ImageManipulator from "expo-image-manipulator";

/**
 * Preprocess image for Gemini Vision:
 * - Resize to max 1024px
 * - Convert to JPEG
 * - Return { base64, mimeType }
 */
export async function preprocessImage(
  uri: string
): Promise<{ base64: string; mimeType: string }> {
  try {
    if (!uri) {
      throw new Error("Invalid image URI");
    }

    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }],
      {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    if (!manipulated || !manipulated.base64) {
      throw new Error("ImageManipulator returned no base64 data");
    }

    // Always JPEG output
    const mimeType = "image/jpeg";

    // Clean base64 (remove accidental prefixes)
    const cleanedBase64 = manipulated.base64.replace(/^data:.*;base64,/, "");

    return {
      base64: cleanedBase64,
      mimeType,
    };
  } catch (err) {
    console.log("❌ preprocessImage failed:", err);
    throw err;
  }
}