// utils/SmartWardrobe/translateWardrobeProfile.ts

import { translateWardrobeBatch } from "./translateWardrobeBatch";
import { Locale, TranslationCache } from "./translationTypes";
import { WardrobeCanonical } from "./wardrobeCanonical";
import { WardrobeProfile } from "./wardrobeProfile";

export async function translateWardrobeProfile(
  canonical: WardrobeCanonical,
  locale: Locale,
  garmentId: string,
  cache: TranslationCache
): Promise<WardrobeProfile> {
  // 1) Cache check
  const cached = await cache.get(garmentId, locale);
  if (cached) return cached;

  console.log("⏱️ batch translation start for", garmentId);

  // 2) Batch translate whole canonical
  const translatedRaw = await translateWardrobeBatch(canonical, locale);

  // 3) Merge canonical + translated
  const translated: WardrobeProfile = {
    ...canonical,
    ...translatedRaw,
    __locale: locale,
  };

  // 4) Log essential fields
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

  // 5) Save to cache
  await cache.set(garmentId, locale, translated);

  console.log("⏱️ batch translation end for", garmentId);

  return translated;
}