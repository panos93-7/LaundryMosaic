import { analyzeGarmentPro } from "../aiGarmentAnalyzerPro";
import { aiCacheGet, aiCacheSet } from "./aiCache";
import { getImageHash } from "./imageHash";

const SAFE_FALLBACK = {
  name: "",
  type: "",
  category: "",
  fabric: "",
  color: "",
  pattern: "",
  stains: [],
  recommended: {
    program: "",
    temp: 30,
    spin: 800,
    detergent: "",
    notes: [],
  },
  care: {
    wash: "",
    bleach: "",
    dry: "",
    iron: "",
    dryclean: "",
    warnings: [],
  },
  risks: {
    shrinkage: "",
    colorBleeding: "",
    delicacy: "",
  },
  washFrequency: "",
  careSymbols: [],
  stainTips: [],
};

export async function analyzeGarmentProCached(base64: string) {
  try {
    const hash = await getImageHash(base64);

    const cached = await aiCacheGet(hash);
    if (cached && typeof cached === "object") {
      if (!Array.isArray(cached.stainTips)) {
        cached.stainTips = [];
      }
      return cached;
    }

    const result = await analyzeGarmentPro(base64);

    if (!result || typeof result !== "object") {
      return SAFE_FALLBACK;
    }

    if (!Array.isArray((result as any).stainTips)) {
      (result as any).stainTips = [];
    }

    await aiCacheSet(hash, result);

    return result;
  } catch (err) {
    console.log("❌ analyzeGarmentProCached error:", err);
    return SAFE_FALLBACK;
  }
}