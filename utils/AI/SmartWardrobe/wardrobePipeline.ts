// utils/SmartWardrobe/wardrobePipeline.ts

import { analyzeWardrobeCached } from "./analyzeWardrobeCached";
import { translateWardrobeProfile } from "./translateWardrobeProfile";
import { translationCache } from "./translationCache";

export async function wardrobePipeline(uri: string, locale: string) {
  const original = await analyzeWardrobeCached(uri);

  const final =
    locale === "en"
      ? original
      : await translateWardrobeProfile(
          original,
          locale,
          Date.now().toString(),
          translationCache
        );

  return { original, profile: final };
}