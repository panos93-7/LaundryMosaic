// utils/SmartWardrobe/wardrobePipeline.ts

import { analyzeWardrobeCached } from "./analyzeWardrobeCached";
import { normalizeCanonical } from "./normalizeCanonical";
import { translateWardrobeProfile } from "./translateWardrobeProfile";
import { translationCache } from "./translationCache";
import { Locale } from "./translationTypes";
import { WardrobeCanonical } from "./wardrobeCanonical";
import { WardrobeProfile } from "./wardrobeProfile";

// Use your existing hashing utility
import { hashQuery } from "../Core/hashQuery";

export interface WardrobePipelineResult {
  original: WardrobeCanonical;
  profile: WardrobeProfile;
  garmentId: string;
}

/* ---------------------------------------------------------
   STABLE GARMENT KEY (NO NEW FILE)
   Only identity fields go into the hash.
--------------------------------------------------------- */
async function wardrobeCanonicalKey(canonical: WardrobeCanonical): Promise<string> {
  const stable = {
    type: canonical.type,
    category: canonical.category,
    fabric: canonical.fabric,
    color: canonical.color,
    careSymbols: [...canonical.careSymbols].sort(),
    risks: {
      shrinkage: canonical.risks.shrinkage,
      colorBleeding: canonical.risks.colorBleeding,
      delicacy: canonical.risks.delicacy,
    },
    washFrequency: canonical.washFrequency,
  };

  return await hashQuery(JSON.stringify(stable));
}

/* ---------------------------------------------------------
   MAIN PIPELINE
--------------------------------------------------------- */
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

  // 4) English → no translation needed
  if (locale === "en") {
    const profile: WardrobeProfile = {
      ...canonical,
      careSymbolLabels: {},
      __locale: "en",
    };
    return { original: canonical, profile, garmentId };
  }

  // 5) Cache check
  const cached = await translationCache.get(garmentId, locale);
  if (cached) {
    console.log("🌍 HIT translation cache for", garmentId, locale);
    return {
      original: canonical,
      profile: cached as WardrobeProfile,
      garmentId,
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
    garmentId,
  };
}