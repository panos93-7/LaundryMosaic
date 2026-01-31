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
};

export type Locale = string; // π.χ. "en", "el", "es", ...

// Απλό interface για cache – εσύ το υλοποιείς όπως θες (AsyncStorage, SQLite, Zustand κλπ)
export interface TranslationCache {
  get(garmentId: string, locale: Locale): Promise<GarmentProfile | null>;
  set(garmentId: string, locale: Locale, value: GarmentProfile): Promise<void>;
}

/**
 * Μεταφράζει ένα GarmentProfile σε targetLocale, με caching.
 * - Αν locale === "en" → επιστρέφει το original
 * - Αν υπάρχει cache → επιστρέφει cache
 * - Αλλιώς → καλεί Gemini proxy, μεταφράζει, κάνει cache, επιστρέφει
 */
export async function translateGarmentProfile(
  original: GarmentProfile,
  targetLocale: Locale,
  garmentId: string,
  cache: TranslationCache
): Promise<GarmentProfile> {
  // Base language: English → δεν χρειάζεται μετάφραση
  if (!targetLocale || targetLocale === "en") {
    return original;
  }

  try {
    // 1. Δες αν υπάρχει ήδη cache
    const cached = await cache.get(garmentId, targetLocale);
    if (cached) {
      return cached;
    }

    // 2. Κάλεσε τον ίδιο Cloudflare Worker για μετάφραση
    const response = await fetch("https://gemini-proxy.panos-ai.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `
You are a professional translator.
Translate the following JSON values into ${targetLocale}.
Keep the JSON structure IDENTICAL.
Translate ONLY the string values.
Do NOT change keys, numbers, or array structure.
Return ONLY valid JSON.

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

    const cleanedJson = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let translated: GarmentProfile;

    try {
      translated = JSON.parse(cleanedJson);
    } catch (e) {
      console.log("❌ Failed to parse translated JSON:", cleanedJson);
      return original;
    }

    // 3. Cache το αποτέλεσμα για αυτό το garment + locale
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