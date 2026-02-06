import { generateCareInstructionsPro } from "../../utils/aiFabricCarePro";
import { translateStainTips } from "../AI/translateStainTips";
import { aiLaundryCache } from "./aiLaundryCache";

export async function generateLaundryAdviceCached(
  locale: string,
  fabric: string,
  query: string,
  history?: any
) {
  // 1) RAW CACHE (NO LOCALE)
  const rawCached = await aiLaundryCache.get(fabric, query, history);

  let rawResult: any = null;

  if (rawCached) {
    console.log("⚡ Using RAW cached Laundry Assistant result");
    rawResult = rawCached;
  } else {
    // 2) AI CALL ONLY IF RAW NOT FOUND
    try {
      rawResult = await generateCareInstructionsPro(query);
    } catch (err) {
      console.log("❌ LaundryAssistant: AI call failed:", err);
      return null;
    }

    // 3) SAVE RAW RESULT
    await aiLaundryCache.set(fabric, query, history, rawResult);
  }

  // 4) TRANSLATE RAW → LOCALE (NO NEW AI CALL)
  try {
    const translated = await translateStainTips(
      rawResult,
      locale,
      `laundry_${fabric}_${query}`
    );

    return translated;
  } catch (err) {
    console.log("⚠️ LaundryAssistant: translation failed, returning raw");
    return rawResult;
  }
}