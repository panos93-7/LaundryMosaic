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

      // 🔥 SAFETY FIX: ensure stainTips always exists
      if (!Array.isArray(cached.stainTips)) {
        cached.stainTips = [];
      }

      return cached;
    }

    // 3) Call original GarmentPro AI
    console.log("🔵 Calling analyzeGarmentPro...");
    const result = await analyzeGarmentPro(base64);
    console.log("🔵 AI RAW RESULT:", result);

    // 4) If AI failed → return SAFE EMPTY OBJECT (never null)
    if (!result || typeof result !== "object") {
      console.log("❌ AI returned null/invalid → using safe fallback");
      return {
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
    }

    // 🔥 SAFETY FIX: ensure stainTips exists before caching
    if (!Array.isArray(result.stainTips)) {
      result.stainTips = [];
    }

    // 5) Save to cache
    await aiCacheSet(hash, result);

    return result;
  } catch (err) {
    console.log("❌ analyzeGarmentProCached error:", err);

    // SAFE FALLBACK (never return null)
    return {
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
  }
}