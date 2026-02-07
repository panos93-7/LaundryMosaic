import { generateCareInstructionsPro } from "../../utils/aiFabricCarePro";
import { aiLaundryCache } from "./aiLaundryCache";
import { translateStainTips } from "./translateStainTips";

function detectQueryLanguage(text: string) {
  return /[α-ωΑ-Ω]/i.test(text) ? "el" : "en";
}

export async function generateLaundryAdviceCached({
  canonicalKey,
  userQuery,
  targetLocale
}: {
  canonicalKey: string;
  userQuery: string;
  targetLocale: string;
}) {
  // 1) Check canonical
  let canonical = await aiLaundryCache.get(canonicalKey, "canonical");

  // 2) If no canonical → generate ONCE
  if (!canonical) {
    const queryLang = detectQueryLanguage(userQuery);

    const ai = await generateCareInstructionsPro(userQuery, queryLang);

    let careInstructions = ai?.careInstructions || [];

    if (typeof careInstructions === "string") {
      careInstructions = careInstructions
        .split(/\n|•|-|\*/g)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (!Array.isArray(careInstructions)) {
      careInstructions = [];
    }

    canonical = {
      care: {
        wash: careInstructions[0] ?? "",
        bleach: careInstructions[1] ?? "",
        dry: careInstructions[2] ?? "",
        iron: careInstructions[3] ?? "",
        dryclean: careInstructions[4] ?? "",
        warnings: careInstructions.slice(5)
      }
    };

    await aiLaundryCache.set(canonicalKey, "canonical", canonical);
  }

  // 3) Check translated
  const translated = await aiLaundryCache.get(
    canonicalKey,
    `translated_${targetLocale}`
  );

  if (translated) {
    return { canonical, translated };
  }

  // 4) Translate ONCE
  const translatedResult = await translateStainTips(canonical, targetLocale);

  await aiLaundryCache.set(
    canonicalKey,
    `translated_${targetLocale}`,
    translatedResult
  );

  return { canonical, translated: translatedResult };
}