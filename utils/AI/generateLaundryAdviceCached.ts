import { generateCareInstructionsPro } from "../../utils/aiFabricCarePro";
import { translateStainTips } from "../AI/translateStainTips";
import { aiLaundryCache } from "./aiLaundryCache";
import { hashQuery } from "./hashQuery";

export async function generateLaundryAdviceCached(
  locale: string,
  fabric: string,
  query: string
) {
  const hashed = await hashQuery(query);

  // 1) CACHE LOOKUP (locale-aware)
  const rawCached = await aiLaundryCache.get(fabric, hashed, locale);

  let rawResult: any = null;

  if (rawCached) {
    console.log("⚡ Using RAW cached Laundry Assistant result");
    rawResult = rawCached;
  } else {
    // 2) AI CALL
    try {
      rawResult = await generateCareInstructionsPro(query);
    } catch (err) {
      console.log("❌ LaundryAssistant: AI call failed:", err);
      return null;
    }

    // 3) MAP AI SCHEMA → APP SCHEMA
    if (rawResult && Array.isArray(rawResult.careInstructions)) {
      const arr = rawResult.careInstructions;

      rawResult = {
        care: {
          wash: arr[0] ?? "",
          bleach: arr[1] ?? "",
          dry: arr[2] ?? "",
          iron: arr[3] ?? "",
          dryclean: arr[4] ?? "",
          warnings: arr.slice(5) ?? []
        },
        stainTips: []
      };
    }

    // 4) SAFETY FALLBACK
    if (!rawResult || !rawResult.care) {
      rawResult = {
        care: {
          wash: "",
          bleach: "",
          dry: "",
          iron: "",
          dryclean: "",
          warnings: []
        },
        stainTips: []
      };
    }

    // 5) SAVE TO CACHE (locale-aware)
    await aiLaundryCache.set(fabric, hashed, locale, rawResult);
  }

  // 6) RETURN (no translation needed)
  return translateStainTips(rawResult);
}