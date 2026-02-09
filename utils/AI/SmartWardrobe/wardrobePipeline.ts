// utils/SmartWardrobe/wardrobePipeline.ts

import { analyzeWardrobeCached } from "./analyzeWardrobeCached";
import { translateWardrobeProfile } from "./translateWardrobeProfile";
import { translationCache } from "./translationCache";
import { Locale } from "./translationTypes";
import { WardrobeCanonical, wardrobeCanonicalKey } from "./wardrobeCanonical";
import { WardrobeProfile } from "./wardrobeProfile";

export interface WardrobePipelineResult {
  original: WardrobeCanonical;
  profile: WardrobeProfile;
}

export async function wardrobePipeline(
  uri: string,
  locale: Locale
): Promise<WardrobePipelineResult> {
  // 1) Canonical garment (deterministic)
  const canonical = await analyzeWardrobeCached(uri);
  console.log("🧩 CANONICAL:", JSON.stringify(canonical, null, 2));

  // 2) Deterministic garment ID
  const garmentId = await wardrobeCanonicalKey(canonical);
  console.log("🧩 garmentId:", garmentId);
  console.log("🌍 wardrobePipeline locale:", locale);

  // 3) English → no translation
  if (locale === "en") {
    const profile: WardrobeProfile = {
      ...canonical,
      careSymbolLabels: {}, // English UI maps directly
      __locale: "en",
    };
    return { original: canonical, profile };
  }

  // 4) Cache check
  const cached = await translationCache.get(garmentId, locale);
  if (cached) {
    console.log("🌍 HIT translation cache for", garmentId, locale);
    return {
      original: canonical,
      profile: cached as WardrobeProfile,
    };
  }

  // 5) Translate (deterministic)
  const translated = await translateWardrobeProfile(
    canonical,
    locale,
    garmentId,
    translationCache
  );

  // 6) Return both original + translated
  return {
    original: canonical,
    profile: translated,
  };
}