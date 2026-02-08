import { aiCacheGet, aiCacheSet } from "../Core/aiCache";
import { getImageHash } from "../Core/imageHash";
import { analyzeImageCanonical } from "./analyzeImageCanonical";

export async function analyzeImageCanonicalCached(base64: string) {
  try {
    const hash = await getImageHash(base64);

    const cached = await aiCacheGet(hash);
    if (cached) return { canonical: cached, hash };

    const canonical = await analyzeImageCanonical(base64);
    if (!canonical) return null;

    await aiCacheSet(hash, canonical);

    return { canonical, hash };
  } catch (err) {
    console.log("❌ analyzeImageCanonicalCached error:", err);
    return null;
  }
}