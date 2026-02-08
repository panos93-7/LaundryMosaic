import i18n from "../../../i18n";
import { smartScanTranslationCache } from "./translationCache";

export async function translateCanonical(canonical: any, hash: string) {
  const locale = i18n.locale;

  if (locale === "en") return canonical;

  const cacheKey = `${hash}:${locale}`;
  const cached = await smartScanTranslationCache.get(cacheKey);
  if (cached) return cached;

  const response = await fetch("https://gemini-proxy.panos-ai.workers.dev", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: `
Translate ONLY the values of this JSON into ${locale}.
Keep structure identical.
Return ONLY JSON.

${JSON.stringify(canonical)}
      `
    })
  });

  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

  const translated = JSON.parse(cleaned);

  await smartScanTranslationCache.set(cacheKey, translated);

  return translated;
}