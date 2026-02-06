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

  const rawCached = await aiLaundryCache.get(fabric, hashed);

  let rawResult: any = null;

  if (rawCached) {
    console.log("⚡ Using RAW cached Laundry Assistant result");
    rawResult = rawCached;
  } else {
    try {
      rawResult = await generateCareInstructionsPro(query);
    } catch (err) {
      console.log("❌ LaundryAssistant: AI call failed:", err);
      return null;
    }

    // ⭐ Fallback to safe schema
    if (!rawResult || typeof rawResult !== "object" || !rawResult.care) {
      rawResult = {
        care: {
          wash: "",
          bleach: "",
          dry: "",
          iron: "",
          dryclean: "",
          warnings: [],
        },
        stainTips: [],
      };
    }

    await aiLaundryCache.set(fabric, hashed, rawResult);
  }

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