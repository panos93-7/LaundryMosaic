import i18n from "../../../i18n";

const batchCache = new Map<string, string>();

export async function translateBatchText(
  text: string,
  localeOverride?: string
) {
  if (!text || typeof text !== "string") return "";

  // 1) Locale
  const rawLocale = localeOverride || i18n.locale || "en";
  const locale = rawLocale.split("-")[0];

  // 2) English → no translation
  if (locale === "en") return text.trim();

  // 3) Cache
  const cacheKey = `${text}:${locale}`;
  if (batchCache.has(cacheKey)) {
    return batchCache.get(cacheKey)!;
  }

  // 4) AI request
  const response = await fetch("https://gemini-proxy.panos-ai.workers.dev", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: `
Translate this text into ${locale}.
Return ONLY the translated text.
No JSON. No markdown. No explanations.

Text:
${text}
      `.trim(),
    }),
  });

  if (!response.ok) {
    console.log("❌ translateBatchText error:", await response.text());
    return text.trim();
  }

  const data = await response.json();
  const raw =
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text.trim();

  // 5) Cache result
  batchCache.set(cacheKey, raw);

  return raw;
}