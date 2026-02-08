import i18n from "../../../i18n";
import { smartScanTranslationCache } from "./translationCache";

export async function translateCanonical(canonical: any, hash: string) {
  const rawLocale = (i18n as any).language || i18n.locale || "en";
  const locale = String(rawLocale).split("-")[0];

  if (locale === "en") {
    return {
      fabric: canonical.fabric || "",
      color: canonical.color || "",
      stains: Array.isArray(canonical.stains) ? canonical.stains : [],
      care: Array.isArray(canonical.care?.warnings)
        ? canonical.care.warnings
        : [],
      recommended: {
        program: canonical.recommended?.program || "",
        temp: canonical.recommended?.temp || "",
        spin: canonical.recommended?.spin || "",
      },
    };
  }

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
      `,
    }),
  });

  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

  const translatedRaw = JSON.parse(cleaned);

  const translated = {
    fabric: translatedRaw.fabric || "",
    color: translatedRaw.color || "",
    stains: Array.isArray(translatedRaw.stains)
      ? translatedRaw.stains
      : [],
    care: Array.isArray(translatedRaw.care?.warnings)
      ? translatedRaw.care.warnings
      : [],
    recommended: {
      program: translatedRaw.recommended?.program || "",
      temp: translatedRaw.recommended?.temp || "",
      spin: translatedRaw.recommended?.spin || "",
    },
  };

  await smartScanTranslationCache.set(cacheKey, translated);

  return translated;
}