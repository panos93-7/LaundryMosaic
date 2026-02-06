import { generateCareInstructionsPro } from "../../utils/aiFabricCarePro";
import { translateStainTips } from "../AI/translateStainTips";
import { aiLaundryCache } from "./aiLaundryCache";
import { normalizeQuery } from "./normalizeQuery";

export async function generateLaundryAdviceCached(
  locale: string,
  fabric: string,
  query: string
) {
  // 1) Normalize query → English
  const normalizedQuery = await normalizeQuery(query);

  // 2) RAW CACHE LOOKUP (locale-agnostic)
  const rawCached = await aiLaundryCache.get(fabric, normalizedQuery);

  let rawResult: any = null;

  if (rawCached) {
    console.log("⚡ Using RAW cached Laundry Assistant result");
    rawResult = rawCached;
  } else {
    // 3) AI CALL ONLY IF RAW NOT FOUND
    try {
      rawResult = await generateCareInstructionsPro(normalizedQuery);
    } catch (err) {
      console.log("❌ LaundryAssistant: AI call failed:", err);
      return null;
    }

    // 4) SAVE RAW RESULT (locale-agnostic)
    await aiLaundryCache.set(fabric, normalizedQuery, rawResult);
  }

  // 5) TRANSLATE RAW → LOCALE (NO NEW AI CALL)
  try {
    const translated = await translateStainTips(
      rawResult,
      locale,
      `laundry_${fabric}_${normalizedQuery}`
    );

    return translated;
  } catch (err) {
    console.log("⚠️ LaundryAssistant: translation failed, returning raw");
    return rawResult;
  }
}