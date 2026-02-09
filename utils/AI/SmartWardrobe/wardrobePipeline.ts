// utils/SmartWardrobe/wardrobePipeline.ts

import { analyzeWardrobeCached } from "./analyzeWardrobeCached";
import { translateWardrobeProfile } from "./translateWardrobeProfile";
import { translationCache } from "./translationCache";
import { Locale } from "./translationTypes";
import { wardrobeCanonicalKey } from "./wardrobeCanonical";

export async function wardrobePipeline(
  uri: string,
  locale: Locale
) {
  // 1) Canonical garment
  const canonical = await analyzeWardrobeCached(uri);
  console.log("🧩 CANONICAL:", JSON.stringify(canonical, null, 2));

  // 2) Deterministic garment ID
  const garmentId = await wardrobeCanonicalKey(canonical);

  console.log("🌍 wardrobePipeline locale:", locale);

  // 3) English → no translation
  if (locale === "en") {
    return {
      original: canonical,
      profile: canonical,
    };
  }

  // 4) Cache check
  const cached = await translationCache.get(garmentId, locale);
  if (cached) {
    console.log("🌍 HIT translation cache for", garmentId, locale);
    return {
      original: canonical,
      profile: cached,
    };
  }

  // 5) Translate
  const translated = await translateWardrobeProfile(
    canonical,
    locale,
    garmentId,
    translationCache
  );

  return {
    original: canonical,
    profile: translated,
  };
}