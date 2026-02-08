// utils/SmartWardrobe/wardrobePipeline.ts

import { analyzeWardrobeCached } from "./analyzeWardrobeCached";
import { translateWardrobeProfile } from "./translateWardrobeProfile";
import { translationCache } from "./translationCache";
import { Locale } from "./translationTypes";
import { wardrobeCanonicalKey } from "./wardrobeCanonical";

export async function wardrobePipeline(
  uri: string,
  locale: Locale,
  translateFn: (text: string, locale: Locale) => Promise<string>
) {
  // 1) Canonical garment (AI analysis + normalize)
  const canonical = await analyzeWardrobeCached(uri);
console.log("🧩 CANONICAL:", JSON.stringify(canonical, null, 2));
  // 2) Deterministic, language‑agnostic garment ID
  const garmentId = await wardrobeCanonicalKey(canonical); // ⭐ FIXED

  // 3) English → no translation needed
  if (locale === "en") {
    return {
      original: canonical,
      profile: canonical,
    };
  }

  // 4) Check translation cache
  const cached = await translationCache.get(garmentId, locale);
  if (cached) {
    return {
      original: canonical,
      profile: cached,
    };
  }

  // 5) Translate canonical → locale
  const translated = await translateWardrobeProfile(
    canonical,
    locale,
    garmentId,
    translateFn,
    translationCache
  );

  // 6) Save translated profile
  await translationCache.set(garmentId, locale, translated);

  return {
    original: canonical,
    profile: translated,
  };
}