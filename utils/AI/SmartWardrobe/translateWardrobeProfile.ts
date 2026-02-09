// utils/SmartWardrobe/translateWardrobeProfile.ts

import { translateWardrobeBatch } from "./translateWardrobeBatch";
import { Locale, TranslationCache } from "./translationTypes";
import { WardrobeCanonical } from "./wardrobeCanonical";
import { WardrobeProfile } from "./wardrobeProfile";

/* ---------------------------------------------------------
   FORCE careSymbolLabels → ALWAYS OBJECT
--------------------------------------------------------- */

function normalizeCareSymbolLabels(
  canonical: WardrobeCanonical,
  raw: any
): Record<string, string> {
  // Already object → OK
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw;
  }

  // Array → map using canonical.careSymbols order
  if (Array.isArray(raw)) {
    const out: Record<string, string> = {};
    canonical.careSymbols.forEach((code: string, i: number) => {
      out[code] = raw[i] ?? "";
    });
    return out;
  }

  // Missing → empty object
  return {};
}

/* ---------------------------------------------------------
   MAIN TRANSLATION PIPELINE
--------------------------------------------------------- */

export async function translateWardrobeProfile(
  canonical: WardrobeCanonical,
  locale: Locale,
  garmentId: string,
  cache: TranslationCache
): Promise<WardrobeProfile> {
  // 1) Cache check
  const cached = await cache.get(garmentId, locale);
  if (cached) {
    console.log("🌍 HIT translation cache for", garmentId, locale);
    return cached;
  }

  console.log("⏱️ batch translation start for", garmentId);

  // 2) Batch translate whole canonical
  const translatedRaw = await translateWardrobeBatch(canonical, locale);

  // 3) Merge canonical + translatedRaw (untyped first)
  const merged: any = {
    ...canonical,
    ...translatedRaw,
    __locale: locale,
  };

  // 4) Normalize careSymbolLabels → ALWAYS object
  merged.careSymbolLabels = normalizeCareSymbolLabels(
    canonical,
    translatedRaw?.careSymbolLabels
  );

  // 5) Cast AFTER normalization
  const translated: WardrobeProfile = merged;

  // 6) Log essential fields
  console.log(
    "🌍 TRANSLATED PROFILE:",
    JSON.stringify(
      {
        locale: translated.__locale,
        name: translated.name,
        type: translated.type,
        color: translated.color,
        careSymbolLabels: translated.careSymbolLabels,
      },
      null,
      2
    )
  );

  // 7) Save to cache
  await cache.set(garmentId, locale, translated);

  console.log("⏱️ batch translation end for", garmentId);

  return translated;
}