import { analyzeWardrobeCached } from "./analyzeWardrobeCached";
import { normalizeCanonical } from "./normalizeCanonical";
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

  // 1) Vision → raw
  const raw = await analyzeWardrobeCached(uri);

  // 2) Deterministic canonical
  const canonical: WardrobeCanonical = normalizeCanonical(raw);
  console.log("🧩 CANONICAL:", JSON.stringify(canonical, null, 2));

  // 3) Deterministic garment ID
  const garmentId = await wardrobeCanonicalKey(canonical);
  console.log("🧩 garmentId:", garmentId);
  console.log("🌍 wardrobePipeline locale:", locale);

  // 4) English → no translation
  if (locale === "en") {
    const profile: WardrobeProfile = {
      ...canonical,
      careSymbolLabels: {},
      __locale: "en",
    };
    return { original: canonical, profile };
  }

  // 5) Cache check
  const cached = await translationCache.get(garmentId, locale);
  if (cached) {
    return {
      original: canonical,
      profile: cached as WardrobeProfile,
    };
  }

  // 6) Translate canonical → locale
  const translated: WardrobeProfile = await translateWardrobeProfile(
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