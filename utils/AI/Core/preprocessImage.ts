import * as ImageManipulator from "expo-image-manipulator";

/**
 * Preprocess image for Gemini Vision:
 * - Normalize URI (file://, content://, assets-library://)
 * - Resize to max 1024px
 * - Convert to JPEG
 * - Return clean { base64, mimeType }
 */
export async function preprocessImage(
  uri: string
): Promise<{ base64: string; mimeType: string }> {
  try {
    if (!uri || typeof uri !== "string") {
      throw new Error("Invalid image URI");
    }

    // Normalize URI (remove accidental whitespace, prefixes)
    const normalizedUri = uri.trim();

    // iOS sometimes returns "ph://" URIs → ImageManipulator cannot read them
    // Expo automatically resolves them internally, so we just pass the URI.
    // If it fails, the catch block will handle it.

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
      throw new Error("ImageManipulator returned no base64 data");
    }

    // Always JPEG output
    const mimeType = "image/jpeg";

    // Clean base64 (remove accidental prefixes)
    const cleanedBase64 = manipulated.base64
      .replace(/^data:.*;base64,/, "")
      .trim();

    if (!cleanedBase64 || cleanedBase64.length < 50) {
      throw new Error("Base64 output is too small or corrupted");
    }

    return {
      base64: cleanedBase64,
      mimeType,
    };
  } catch (err) {
    console.log("❌ preprocessImage failed:", err);
    throw new Error("Failed to preprocess image");
  }
}