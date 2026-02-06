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

  // 1) RAW CACHE LOOKUP
  const rawCached = await aiLaundryCache.get(fabric, hashed);

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
    // AI returns: careInstructions[]
    // App expects: care.{wash,bleach,dry,iron,dryclean,warnings[]}
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
        stainTips: [] // AI does not provide stain tips → empty array
      };
    }

    // 4) SAFETY FALLBACK (in case AI returned weird schema)
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

    // 5) SAVE RAW RESULT TO CACHE
    await aiLaundryCache.set(fabric, hashed, rawResult);
  }

  // 6) TRANSLATE RAW → LOCALE
  try {
    const translated = await translateStainTips(
      rawResult,
      locale,
      `laundry_${fabric}_${hashed}`
    );

    return translated;
  } catch (err) {
    console.log("⚠️ LaundryAssistant: translation failed, returning raw");
    return rawResult;
  }
}