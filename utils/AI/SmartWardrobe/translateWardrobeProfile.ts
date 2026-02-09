// utils/SmartWardrobe/translateWardrobeProfile.ts

import { translateWardrobeBatch } from "./translateWardrobeBatch";
import { Locale, TranslationCache } from "./translationTypes";
import { WardrobeCanonical } from "./wardrobeCanonical";

export async function translateWardrobeProfile(
  canonical: WardrobeCanonical,
  locale: Locale,
  garmentId: string,
  cache: TranslationCache
): Promise<WardrobeCanonical> {
  // 1) Cache check
  const cached = await cache.get(garmentId, locale);
  if (cached) return cached;

  console.log("⏱️ batch translation start for", garmentId);

  // 2) Batch translate whole canonical
  const translatedRaw = await translateWardrobeBatch(canonical, locale);

  const translated: WardrobeCanonical = {
    ...canonical,
    ...translatedRaw,
    __locale: locale,
  };

  console.log(
    "🌍 TRANSLATED PROFILE:",
    JSON.stringify(
      {
        locale: translated.__locale,
        name: translated.name,
        type: translated.type,
        color: translated.color,
      },
      null,
      2
    )
  );

  // 3) Save to cache
  await cache.set(garmentId, locale, translated);

  console.log("⏱️ batch translation end for", garmentId);

  return translated;
}