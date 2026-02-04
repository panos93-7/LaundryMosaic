import { analyzeGarmentPro } from "../aiGarmentAnalyzerPro";
import { aiCacheGet, aiCacheSet } from "./aiCache";
import { getImageHash } from "./imageHash";

export async function analyzeGarmentProCached(base64: string) {
  try {
    // 1) Hash image
    const hash = await getImageHash(base64);

    // 2) Check cache
    const cached = await aiCacheGet(hash);
    if (cached) {
      console.log("⚡ Using cached GarmentPro result");
      return cached;
    }

    // 3) Call original GarmentPro AI
    const result = await analyzeGarmentPro(base64);
    if (!result) return null;

    // 4) Save to cache
    await aiCacheSet(hash, result);

    return result;
  } catch (err) {
    console.log("❌ analyzeGarmentProCached error:", err);
    return null;
  }
}