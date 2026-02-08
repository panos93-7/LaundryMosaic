// utils/SmartWardrobe/translateWardrobeProfile.ts

import { translateWardrobeBatch } from "./translateWardrobeBatch";
import { Locale } from "./translationTypes";
import { WardrobeCanonical } from "./wardrobeCanonical";

export async function translateWardrobeProfile(
  canonical: WardrobeCanonical,
  locale: Locale,
  garmentId: string,
  cache: {
    get: (id: string, locale: Locale) => Promise<WardrobeCanonical | null>;
    set: (id: string, locale: Locale, value: WardrobeCanonical) => Promise<void>;
  }
): Promise<WardrobeCanonical> {

  // 1) Cache check
  const cached = await cache.get(garmentId, locale);
  if (cached) return cached;

  console.log("⏱️ batch translation start for", garmentId);

  // 2) Batch translate entire canonical object
  const translated = await translateWardrobeBatch(canonical, locale);

  console.log("⏱️ batch translation end for", garmentId);

  // 3) Save to cache
  await cache.set(garmentId, locale, translated);

  return translated;
}