import { generateCareInstructionsPro } from "../../utils/aiFabricCarePro";
import { aiLaundryCache } from "./aiLaundryCache";
import { translateStainTips } from "./translateStainTips";

export async function generateLaundryAdviceCached({
  canonicalKey,
  userQuery,
  targetLocale
}: {
  canonicalKey: string;
  userQuery: string;
  targetLocale: string;
}) {
  // 1) Δες αν υπάρχει canonical result
  const canonical = await aiLaundryCache.get(canonicalKey, "canonical");

  let canonicalResult = canonical;

  // 2) Αν ΔΕΝ υπάρχει canonical → κάνε AI call ΜΙΑ φορά
  if (!canonicalResult) {
    try {
      const ai = await generateCareInstructionsPro(userQuery, targetLocale);

      // Normalize AI output
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

      canonicalResult = {
        care: {
          wash: careInstructions[0] ?? "",
          bleach: careInstructions[1] ?? "",
          dry: careInstructions[2] ?? "",
          iron: careInstructions[3] ?? "",
          dryclean: careInstructions[4] ?? "",
          warnings: careInstructions.slice(5) ?? []
        }
      };

      // Save canonical
      await aiLaundryCache.set(canonicalKey, "canonical", canonicalResult);
    } catch (err) {
      console.log("❌ AI call failed:", err);
      return null;
    }
  }

  // 3) Δες αν υπάρχει translated result για targetLocale
  const translated = await aiLaundryCache.get(
    canonicalKey,
    `translated_${targetLocale}`
  );

  if (translated) {
    return {
      canonical: canonicalResult,
      translated
    };
  }

  // 4) Αν δεν υπάρχει → κάνε translation ΜΙΑ φορά
  const translatedResult = await translateStainTips(
    canonicalResult,
    targetLocale
  );

  // 5) Save translated version
  await aiLaundryCache.set(
    canonicalKey,
    `translated_${targetLocale}`,
    translatedResult
  );

  return {
    canonical: canonicalResult,
    translated: translatedResult
  };
}