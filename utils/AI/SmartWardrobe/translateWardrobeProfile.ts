// utils/SmartWardrobe/translateWardrobeProfile.ts

import { CARE_SYMBOL_MAP } from "./careSymbolMap";
import { Locale, TranslationCache } from "./translationTypes";
import { WardrobeCanonical } from "./wardrobeCanonical";
import { WardrobeProfile } from "./wardrobeProfile";

// AI translation ONLY for sentences
import { translateWardrobeBatch } from "./translateWardrobeBatch";

/* ---------------------------------------------------------
   IMPORT ALL LOCALES
--------------------------------------------------------- */

import de from "../../../locales/de.json";
import el from "../../../locales/el.json";
import en from "../../../locales/en.json";
import es from "../../../locales/es.json";
import fr from "../../../locales/fr.json";
import it from "../../../locales/it.json";
import ja from "../../../locales/ja.json";
import ko from "../../../locales/ko.json";
import ptBR from "../../../locales/pt-BR.json";
import ptPT from "../../../locales/pt-PT.json";
import ru from "../../../locales/ru.json";
import tr from "../../../locales/tr.json";
import zhTW from "../../../locales/zh-TW.json";

const LOCALE_JSON: Record<string, any> = {
  en,
  el,
  es,
  fr,
  de,
  it,
  tr,
  ru,
  ja,
  ko,
  "zh-TW": zhTW,
  "pt-PT": ptPT,
  "pt-BR": ptBR,
};

/* ---------------------------------------------------------
   MAIN TRANSLATION PIPELINE
--------------------------------------------------------- */

export async function translateWardrobeProfile(
  canonical: WardrobeCanonical,
  locale: Locale,
  garmentId: string,
  cache: TranslationCache
): Promise<WardrobeProfile> {
  const json = LOCALE_JSON[locale] ?? LOCALE_JSON["en"];

  // 1) Cache check
  const cached = await cache.get(garmentId, locale);
  if (cached) {
    console.log("🌍 HIT translation cache for", garmentId, locale);
    return cached;
  }

  console.log("⏱️ batch translation start for", garmentId);

  // 2) AI translation ONLY for sentences
  const translatedRaw = await translateWardrobeBatch(canonical, locale);

  // 3) Merge canonical + AI sentences
  const merged: any = {
    ...canonical,
    ...translatedRaw,
    __locale: locale,
  };

  /* ---------------------------------------------------------
     CARE SYMBOL LABELS FROM JSON (NOT AI)
  --------------------------------------------------------- */
  merged.careSymbolLabels = {};

  for (const symbol of canonical.careSymbols) {
  const jsonKey =
    CARE_SYMBOL_MAP[symbol as keyof typeof CARE_SYMBOL_MAP];

  if (jsonKey && json.careSymbols?.[jsonKey]) {
    merged.careSymbolLabels[symbol] = json.careSymbols[jsonKey];
  } else {
    merged.careSymbolLabels[symbol] = symbol; // fallback
  }
}

  /* ---------------------------------------------------------
     CAST AFTER NORMALIZATION
  --------------------------------------------------------- */
  const translated: WardrobeProfile = merged;

  // 4) Save to cache
  await cache.set(garmentId, locale, translated);

  console.log("⏱️ batch translation end for", garmentId);

  return translated;
}