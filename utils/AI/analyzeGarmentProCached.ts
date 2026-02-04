import { analyzeGarmentPro } from "../aiGarmentAnalyzerPro";
import { aiCacheGet, aiCacheSet } from "./aiCache";
import { getImageHash } from "./imageHash";

const SAFE_FALLBACK = {
  name: "",
  type: "",
  category: "",
  fabric: "cotton",
  color: "white",
  pattern: "",
  stains: [],
  stainTips: [],
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
};

function normalize(result: any) {
  if (!result || typeof result !== "object") return SAFE_FALLBACK;

  return {
    name: result.name || "",
    type: result.type || "",
    category: result.category || "",
    fabric: typeof result.fabric === "string" ? result.fabric : "cotton",
    color: typeof result.color === "string" ? result.color : "white",
    pattern: result.pattern || "",

    stains: Array.isArray(result.stains) ? result.stains : [],
    stainTips: Array.isArray(result.stainTips) ? result.stainTips : [],

    recommended: {
      program: result?.recommended?.program || "",
      temp:
        typeof result?.recommended?.temp === "number"
          ? result.recommended.temp
          : 30,
      spin:
        typeof result?.recommended?.spin === "number"
          ? result.recommended.spin
          : 800,
      detergent: result?.recommended?.detergent || "",
      notes: Array.isArray(result?.recommended?.notes)
        ? result.recommended.notes
        : [],
    },

    care: {
      wash: result?.care?.wash || "",
      bleach: result?.care?.bleach || "",
      dry: result?.care?.dry || "",
      iron: result?.care?.iron || "",
      dryclean: result?.care?.dryclean || "",
      warnings: Array.isArray(result?.care?.warnings)
        ? result.care.warnings
        : [],
    },

    risks: {
      shrinkage: result?.risks?.shrinkage || "",
      colorBleeding: result?.risks?.colorBleeding || "",
      delicacy: result?.risks?.delicacy || "",
    },

    washFrequency: result.washFrequency || "",
    careSymbols: Array.isArray(result.careSymbols)
      ? result.careSymbols
      : [],
  };
}

export async function analyzeGarmentProCached(base64: string) {
  try {
    const hash = await getImageHash(base64);

    // CACHE HIT
    const cached = await aiCacheGet(hash);
    if (cached && typeof cached === "object") {
      const normalized = normalize(cached);
      return normalized;
    }

    // AI CALL
    const result = await analyzeGarmentPro(base64);

    const normalized = normalize(result);

    // SAVE NORMALIZED RESULT
    await aiCacheSet(hash, normalized);

    return normalized;
  } catch (err) {
    console.log("❌ analyzeGarmentProCached error:", err);
    return SAFE_FALLBACK;
  }
}