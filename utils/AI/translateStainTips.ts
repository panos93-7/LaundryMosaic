import { analyzeTextWithGemini } from "./aiClient";
import { getImageHash } from "./imageHash";
import { translationCacheStains } from "./translationCacheStains";

/**
 * Translate a single string safely
 */
async function translateOne(text: string, locale: string, cacheKeyPrefix: string) {
  if (!text || typeof text !== "string") return text;

  // English → no translation needed
  if (!locale || locale.startsWith("en")) return text;

  // Build cache key
  const hash = await getImageHash(text);
  const cacheKey = `${cacheKeyPrefix}_${locale}_${hash}`;

  // Check cache
  const cached = translationCacheStains.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }

  const prompt = `
Translate the following text into ${locale}.
Return ONLY a JSON string. No explanations, no markdown.

"${text}"
`;

  let translated: any = null;

  try {
    translated = await analyzeTextWithGemini(prompt);
  } catch {
    translated = text;
  }

  // Normalize output
  let finalText = text;

  if (typeof translated === "string") {
    finalText = translated.trim();
  } else if (Array.isArray(translated) && translated.length > 0) {
    finalText = translated[0];
  } else if (translated?.text) {
    finalText = translated.text;
  }

  // Save to cache
  try {
    translationCacheStains.set(cacheKey, JSON.stringify(finalText));
  } catch {}

  return finalText;
}

/**
 * Translate an array of strings safely
 */
export async function translateStainTips(
  input: any,
  locale: string,
  cacheKeyPrefix: string
) {
  const safeArray = Array.isArray(input)
    ? input.filter((t) => typeof t === "string")
    : typeof input === "string"
    ? [input]
    : [];

  if (!locale || locale.startsWith("en")) return safeArray;

  const results: string[] = [];

  for (const item of safeArray) {
    const translated = await translateOne(item, locale, cacheKeyPrefix);
    results.push(translated);
  }

  return results;
}