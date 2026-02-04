import { analyzeImageWithGemini } from "../../services/analyzeImage";
import { aiCacheGet, aiCacheSet } from "./aiCache";
import { getImageHash } from "./imageHash";

export async function analyzeImageCached(base64: string, mimeType?: string) {
  try {
    const hash = await getImageHash(base64);

    // 1) Check cache
    const cached = await aiCacheGet(hash);
    if (cached) {
      console.log("⚡ Using cached AI result (image)");
      return cached;
    }

    // 2) Call AI
    const result = await analyzeImageWithGemini(base64, mimeType);
    if (!result) return null;

    // 3) Save to cache
    await aiCacheSet(hash, result);

    return result;
  } catch (err) {
    console.log("❌ analyzeImageCached error:", err);
    return null;
  }
}