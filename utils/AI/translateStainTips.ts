import { analyzeImageWithGemini } from "./aiClient";
import { getImageHash } from "./imageHash";
import { translationCacheStains } from "./translationCacheStains";

export async function translateStainTips(
  tips: any,
  locale: string,
  cacheKeyPrefix: string
) {
  // 1) Sanitize input
  const safeTips = Array.isArray(tips)
    ? tips.filter((t) => typeof t === "string")
    : [];

  // 2) English → no translation needed
  if (!locale || locale.startsWith("en")) {
    return safeTips;
  }

  // 3) Build deduped cache key using imageHash.ts
  const stepsString = safeTips.join("||");
  const stepsHash = await getImageHash(stepsString);
  const cacheKey = `${cacheKeyPrefix}_${locale}_${stepsHash}`;

  // 4) Check cache
  const cached = translationCacheStains.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // corrupted cache → ignore
    }
  }

  // 5) Build translation prompt
  const prompt = `
Translate the following stain removal steps into ${locale}.
Return ONLY a JSON array of strings. No explanations, no markdown.

${JSON.stringify(safeTips)}
`;

  let translated: any = null;

  try {
    // 6) Call Gemini for translation
    translated = await analyzeImageWithGemini({
      base64: "",
      prompt,
    });

    // 7) Validate AI output
    if (!Array.isArray(translated)) {
      translated = safeTips;
    } else {
      translated = translated.filter((s) => typeof s === "string");
    }
  } catch {
    // AI failed → fallback to original English
    translated = safeTips;
  }

  // 8) Save to cache
  try {
    translationCacheStains.set(cacheKey, JSON.stringify(translated));
  } catch {
    // ignore cache write errors
  }

  return translated;
}