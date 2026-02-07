import { generateCareInstructionsPro } from "../../utils/aiFabricCarePro";
import { translateStainTips } from "../AI/translateStainTips";
import { aiLaundryCache } from "./aiLaundryCache";
import { hashQuery } from "./hashQuery";

export async function generateLaundryAdviceCached(
  locale: string,
  fabric: string,
  query: string
) {
  // Normalize locale so cache keys are stable
  const normalizedLocale = locale.split("-")[0].toLowerCase();

  const hashed = await hashQuery(query);

  // 1) CACHE LOOKUP (locale-aware)
  const rawCached = await aiLaundryCache.get(
    fabric,
    hashed,
    normalizedLocale
  );

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

    // 3) NORMALIZE AI OUTPUT BEFORE MAPPING
    let careInstructions = rawResult?.careInstructions;

    // Convert null/undefined → []
    if (!careInstructions) {
      careInstructions = [];
    }

    // Convert string → array (split by newline or bullet)
    if (typeof careInstructions === "string") {
      careInstructions = careInstructions
        .split(/\n|•|-|\*/g)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }

    // Convert object → array of values
    if (typeof careInstructions === "object" && !Array.isArray(careInstructions)) {
      careInstructions = Object.values(careInstructions)
        .map((s) => (typeof s === "string" ? s.trim() : ""))
        .filter((s) => s.length > 0);
    }

    // Ensure array
    if (!Array.isArray(careInstructions)) {
      careInstructions = [];
    }

    // Strip prefixes like "el." or "gr."
    const clean = (s: string) =>
      typeof s === "string"
        ? s.replace(/^(el\.|gr\.)/i, "").trim()
        : s;

    careInstructions = careInstructions.map(clean);

    // 4) MAP AI SCHEMA → APP SCHEMA
    rawResult = {
      care: {
        wash: careInstructions[0] ?? "",
        bleach: careInstructions[1] ?? "",
        dry: careInstructions[2] ?? "",
        iron: careInstructions[3] ?? "",
        dryclean: careInstructions[4] ?? "",
        warnings: careInstructions.slice(5) ?? []
      },
      stainTips: []
    };

    // 5) SAVE TO CACHE (locale-aware)
    await aiLaundryCache.set(
      fabric,
      hashed,
      normalizedLocale,
      rawResult
    );
  }

  // 6) RETURN (no translation needed)
  return translateStainTips(rawResult);
}