import { analyzeImageWithGemini } from "./aiClient";
import { getImageHash } from "./imageHash";
import { translationCacheStains } from "./translationCacheStains";

function normalizeTranslated(raw: any): string[] {
  if (!raw) return [];

  // Case 1: array of strings
  if (Array.isArray(raw)) {
    return raw.filter((s: any) => typeof s === "string");
  }

  // Case 2: { steps: [...] }
  const steps = (raw as any).steps;
  if (Array.isArray(steps)) {
    return steps.filter((s: any) => typeof s === "string");
  }

  // Case 3: { tips: [...] }
  const tips = (raw as any).tips;
  if (Array.isArray(tips)) {
    return tips.filter((t: any) => typeof t === "string");
  }

  // Case 4: single string
  if (typeof raw === "string") {
    return [raw];
  }

  // Case 5: { text: "..." }
  const text = (raw as any).text;
  if (typeof text === "string") {
    return [text];
  }

  return [];
}

export async function translateStainTips(
  tips: any,
  locale: string,
  cacheKeyPrefix: string
) {
  // 1) Sanitize input
  const safeTips = Array.isArray(tips)
    ? tips.filter((t: any) => typeof t === "string")
    : [];

  // 2) English → no translation needed
  if (!locale || locale.startsWith("en")) {
    return safeTips;
  }

  // 3) Build deduped cache key
  const stepsString = safeTips.join("||");
  const stepsHash = await getImageHash(stepsString);
  const cacheKey = `${cacheKeyPrefix}_${locale}_${stepsHash}`;

  // 4) Check cache
  const cached = translationCacheStains.get(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      return normalizeTranslated(parsed);
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
    translated = await analyzeImageWithGemini({
      base64: "",
      prompt,
    });
  } catch {
    translated = safeTips;
  }

  // 7) Normalize AI output
  const normalized = normalizeTranslated(translated);
  const finalOutput = normalized.length > 0 ? normalized : safeTips;

  // 8) Save to cache
  try {
    translationCacheStains.set(cacheKey, JSON.stringify(finalOutput));
  } catch {
    // ignore cache write errors
  }

  return finalOutput;
}