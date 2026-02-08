import i18n from "../../../i18n";
import { smartScanTranslationCache } from "./translationCache";

export async function translateCanonical(
  canonical: any,
  hash: string,
  options: { signal?: AbortSignal } = {}
) {
  const { signal } = options;

  try {
    /* ---------------------------------------------------------------------- */
    /* 1) DETECT LOCALE (FIXED)                                               */
    /* ---------------------------------------------------------------------- */
    const rawLocale = String(i18n.locale || "en");
    const locale = rawLocale.split("-")[0];

    /* ---------------------------------------------------------------------- */
    /* 2) ENGLISH → NO TRANSLATION NEEDED                                     */
    /* ---------------------------------------------------------------------- */
    if (locale === "en") {
      return normalizeTranslated(canonical);
    }

    /* ---------------------------------------------------------------------- */
    /* 3) CACHE LOOKUP                                                        */
    /* ---------------------------------------------------------------------- */
    const cacheKey = `${hash}:${locale}`;
    const cached = await smartScanTranslationCache.get(cacheKey);
    if (cached) return cached;

    /* ---------------------------------------------------------------------- */
    /* 4) AI TRANSLATION REQUEST                                              */
    /* ---------------------------------------------------------------------- */
    const response = await fetch(
      "https://gemini-proxy.panos-ai.workers.dev",
      {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: buildPrompt(locale, canonical),
        }),
      }
    );

    if (!response.ok) {
      console.log("❌ translateCanonical worker error:", await response.text());
      return normalizeTranslated(canonical);
    }

    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    /* ---------------------------------------------------------------------- */
    /* 5) ENVELOPE VALIDATION                                                 */
    /* ---------------------------------------------------------------------- */
    if (!raw.startsWith("{") || !raw.endsWith("}")) {
      console.log("❌ Invalid translation JSON envelope:", raw);
      return normalizeTranslated(canonical);
    }

    /* ---------------------------------------------------------------------- */
    /* 6) PARSE JSON SAFELY                                                   */
    /* ---------------------------------------------------------------------- */
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.log("❌ translateCanonical JSON parse error:", raw);
      return normalizeTranslated(canonical);
    }

    /* ---------------------------------------------------------------------- */
    /* 7) NORMALIZE OUTPUT                                                    */
    /* ---------------------------------------------------------------------- */
    const translated = normalizeTranslated(parsed);

    /* ---------------------------------------------------------------------- */
    /* 8) CACHE RESULT                                                        */
    /* ---------------------------------------------------------------------- */
    await smartScanTranslationCache.set(cacheKey, translated);

    return translated;
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.log("⛔ translateCanonical aborted");
      return null;
    }

    console.log("❌ translateCanonical fatal error:", err);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                               CANONICAL PROMPT                             */
/* -------------------------------------------------------------------------- */

function buildPrompt(locale: string, canonical: any) {
  return `
Translate ONLY the values of this JSON into ${locale}.
Keep the structure IDENTICAL.
Return ONLY valid JSON.
No markdown. No prose. No explanations.
Never wrap JSON in backticks.

JSON to translate:
${JSON.stringify(canonical)}
`.trim();
}

/* -------------------------------------------------------------------------- */
/*                         CANONICAL NORMALIZATION                            */
/* -------------------------------------------------------------------------- */

function normalizeTranslated(obj: any) {
  const safeString = (v: any) =>
    typeof v === "string" && v.trim() ? v.trim() : "";

  const safeArray = (arr: any) =>
    Array.isArray(arr)
      ? arr
          .filter((x) => typeof x === "string")
          .map((x) => x.trim())
      : [];

  return {
    fabric: safeString(obj.fabric),
    color: safeString(obj.color),
    stains: safeArray(obj.stains),

    care: safeArray(obj?.care?.warnings),

    recommended: {
      program: safeString(obj?.recommended?.program),
      temp: obj?.recommended?.temp ?? "",
      spin: obj?.recommended?.spin ?? "",
    },
  };
}