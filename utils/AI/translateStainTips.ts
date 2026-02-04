import { analyzeImageWithGemini } from "./aiClient";
import { getImageHash } from "./imageHash";
import { translationCacheStains } from "./translationCacheStains";

/**
 * Normalizes any AI translation output into a clean string[]
 */
function normalizeTranslated(raw: any): string[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw.filter((s: any) => typeof s === "string");
  }

  const steps = (raw as any).steps;
  if (Array.isArray(steps)) {
    return steps.filter((s: any) => typeof s === "string");
  }

  const tips = (raw as any).tips;
  if (Array.isArray(tips)) {
    return tips.filter((t: any) => typeof t === "string");
  }

  if (typeof raw === "string") {
    return [raw];
  }

  const text = (raw as any).text;
  if (typeof text === "string") {
    return [text];
  }

  return [];
}

/**
 * Generic AI translator for ANY text array.
 * Works for stain tips, fabric, color, care instructions, etc.
 */
export async function translateStainTips(
  input: any,
  locale: string,
  cacheKeyPrefix: string
) {
  // Normalize input to array of strings
  const safeArray = Array.isArray(input)
    ? input.filter((t: any) => typeof t === "string")
    : typeof input === "string"
    ? [input]
    : [];

  // English → no translation needed
  if (!locale || locale.startsWith("en")) {
    return safeArray;
  }

  // Build cache key
  const joined = safeArray.join("||");
  const hash = await getImageHash(joined);
  const cacheKey = `${cacheKeyPrefix}_${locale}_${hash}`;

  // Check cache
  const cached = translationCacheStains.get(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      return normalizeTranslated(parsed);
    } catch {
      // ignore corrupted cache
    }
  }

  // Build translation prompt
  const prompt = `
Translate the following text into ${locale}.
Return ONLY a JSON array of strings. No explanations, no markdown.

${JSON.stringify(safeArray)}
`;

  let translated: any = null;

  try {
    translated = await analyzeImageWithGemini({
      base64: "",
      prompt,
    });
  } catch {
    translated = safeArray;
  }

  const normalized = normalizeTranslated(translated);
  const finalOutput = normalized.length > 0 ? normalized : safeArray;

  // Save to cache
  try {
    translationCacheStains.set(cacheKey, JSON.stringify(finalOutput));
  } catch {
    // ignore cache write errors
  }

  return finalOutput;
}