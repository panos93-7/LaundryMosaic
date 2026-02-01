export type GarmentProfile = {
  name: string;
  type: string;
  category: string;
  fabric: string;
  color: string;
  pattern: string;
  stains: string[];
  recommended: {
    program: string;
    temp: number | string;
    spin: number | string;
    detergent: string;
    notes: string[];
  };
  care: {
    wash: string;
    bleach: string;
    dry: string;
    iron: string;
    dryclean: string;
    warnings: string[];
  };
  risks: {
    shrinkage: string;
    colorBleeding: string;
    delicacy: string;
  };
  washFrequency: string;
  careSymbols: string[];

  // ⭐ THIS FIXES THE __locale ERROR
  [key: string]: any;
};

export type Locale = string;

export interface TranslationCache {
  get(garmentId: string, locale: Locale): Promise<GarmentProfile | null>;
  set(garmentId: string, locale: Locale, value: GarmentProfile): Promise<void>;
}

export async function translateGarmentProfile(
  original: GarmentProfile,
  targetLocale: Locale,
  garmentId: string,
  cache: TranslationCache
): Promise<GarmentProfile> {
  if (!targetLocale || targetLocale === "en") {
    return original;
  }

  try {
    // 1. Check cache
    const cached = await cache.get(garmentId, targetLocale);
    if (cached) return cached;

    // 2. Call translation worker
    const response = await fetch("https://gemini-proxy.panos-ai.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `
You are a professional translator specializing in clothing, laundry care, and textile terminology.

TASK:
Translate ONLY the string values of the following JSON into the target language: ${targetLocale}.
Keep the JSON structure 100% IDENTICAL.
Do NOT add, remove, rename, or reorder keys.
Do NOT change numbers, units, arrays, or formatting.
Do NOT add explanations, comments, or extra text.
Return ONLY valid JSON — no markdown, no code fences, no prose.

IMPORTANT RULES:
- Translate all descriptive fields naturally (name, type, fabric, color, pattern, stains, care, recommended, risks, washFrequency, careSymbols).
- For risks (shrinkage, colorBleeding, delicacy), translate the meaning, NOT the literal English word. Use natural equivalents in the target language.
- If a value is already numeric (e.g., 30, 800), keep it numeric.
- If a value contains units (e.g., "30°C", "800 rpm"), keep the units.
- If a value is an array of strings, translate each string.

JSON to translate:
${JSON.stringify(original)}
`
      })
    });

    if (!response.ok) {
      console.log("❌ Translation worker error:", await response.text());
      return original;
    }

    const data = await response.json();

    let rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Remove markdown fences
    rawText = rawText.replace(/```json/g, "").replace(/```/g, "");

    // Extract JSON substring
    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) {
      console.log("❌ No JSON found in translation:", rawText);
      return original;
    }

    const jsonString = rawText.substring(firstBrace, lastBrace + 1);

    let translated: GarmentProfile;

    try {
      translated = JSON.parse(jsonString);
    } catch (e) {
      console.log("❌ Failed to parse translated JSON:", jsonString);
      return original;
    }

    // 3. Cache translated result
    try {
      await cache.set(garmentId, targetLocale, translated);
    } catch (e) {
      console.log("⚠️ Failed to cache translated garment:", e);
    }

    return translated;
  } catch (err) {
    console.log("❌ translateGarmentProfile error:", err);
    return original;
  }
}