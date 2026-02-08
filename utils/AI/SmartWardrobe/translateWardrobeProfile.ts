// utils/SmartWardrobe/translateWardrobeProfile.ts

import { TranslationCache } from "./translationTypes";
import { WardrobeCanonical } from "./wardrobeCanonical";

export async function translateWardrobeProfile(
  original: WardrobeCanonical,
  locale: string,
  garmentId: string,
  cache: TranslationCache
) {
  if (locale === "en") return { ...original, __locale: "en" };

  const cached = await cache.get(garmentId, locale);
  if (cached) return cached;

  const response = await fetch("https://gemini-proxy.panos-ai.workers.dev", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: `
Translate ONLY the values of this JSON into ${locale}.
Keep structure identical.
Return ONLY JSON.

${JSON.stringify(original)}
`,
    }),
  });

  const data = await response.json();
  let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  raw = raw.replace(/```json/g, "").replace(/```/g, "");

  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");

  const json = JSON.parse(raw.substring(first, last + 1));

  json.__locale = locale;

  await cache.set(garmentId, locale, json);

  return json;
}