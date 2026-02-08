// utils/SmartWardrobe/translateWardrobeProfile.ts

import { Locale } from "./translationTypes";
import { WardrobeCanonical } from "./wardrobeCanonical";

export async function translateWardrobeProfile(
  canonical: WardrobeCanonical,
  locale: Locale,
  garmentId: string,
  translateFn: (text: string, locale: Locale) => Promise<string>,
  cache: {
    get: (id: string, locale: Locale) => Promise<WardrobeCanonical | null>;
    set: (id: string, locale: Locale, value: WardrobeCanonical) => Promise<void>;
  }
): Promise<WardrobeCanonical> {
  // 1) Translation cache check (persistent)
  const cached = await cache.get(garmentId, locale);
  if (cached) return cached;

  // 2) Logging start
  console.log("⏱️ translation start for", garmentId);

  // 3) Helper for translating strings with timing logs
  const t = async (v: string) => {
    if (!v) return "";

    const start = Date.now();
    const result = await translateFn(v, locale);
    console.log("⏱️ translated:", `"${v}"`, "in", Date.now() - start, "ms");
    return result;
  };

  // 4) Helper for translating arrays
  const tArr = async (arr: string[]) =>
    Promise.all(arr.map((item) => t(item)));

  // 5) Build translated garment
  const translated: WardrobeCanonical = {
    ...canonical,
    __locale: locale,

    name: await t(canonical.name),
    type: await t(canonical.type),
    category: await t(canonical.category),
    fabric: await t(canonical.fabric),
    color: await t(canonical.color),
    pattern: await t(canonical.pattern),

    stains: await tArr(canonical.stains),
    stainTips: await tArr(canonical.stainTips),

    recommended: {
      ...canonical.recommended,
      program: await t(canonical.recommended.program),
      detergent: await t(canonical.recommended.detergent),
      notes: await tArr(canonical.recommended.notes),
    },

    care: {
      ...canonical.care,
      wash: await t(canonical.care.wash),
      bleach: await t(canonical.care.bleach),
      dry: await t(canonical.care.dry),
      iron: await t(canonical.care.iron),
      dryclean: await t(canonical.care.dryclean),
      warnings: await tArr(canonical.care.warnings),
    },

    risks: {
      shrinkage: await t(canonical.risks.shrinkage),
      colorBleeding: await t(canonical.risks.colorBleeding),
      delicacy: await t(canonical.risks.delicacy),
    },

    washFrequency: await t(canonical.washFrequency),

    // careSymbols ΔΕΝ μεταφράζονται εδώ
    careSymbols: canonical.careSymbols,
  };

  // 6) Save to translation cache (persistent)
  await cache.set(garmentId, locale, translated);

  // 7) Logging end
  console.log("⏱️ translation finished for", garmentId);

  return translated;
}