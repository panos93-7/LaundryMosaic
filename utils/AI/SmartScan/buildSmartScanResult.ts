import { analyzeImageCanonicalCached } from "./analyzeImageCanonicalCached";
import { generateStainRemovalTipsCached } from "./generateStainRemovalTips";
import { translateCanonical } from "./translateCanonical";

export async function buildSmartScanResult(base64: string) {
  const canonicalResult = await analyzeImageCanonicalCached(base64);
  if (!canonicalResult) return null;

  const { canonical, hash } = canonicalResult;

  // ⭐ Normalize stains HERE (not in screen)
  const stains = Array.isArray(canonical?.stains)
    ? canonical.stains
        .map((s: any) =>
          typeof s === "string"
            ? s
            : typeof s?.type === "string"
            ? s.type
            : ""
        )
        .filter(Boolean)
    : [];

  const fabric = typeof canonical?.fabric === "string" ? canonical.fabric : "";

  const translatedRaw = await translateCanonical(canonical, hash);
  const translated =
    translatedRaw && typeof translatedRaw === "object" ? translatedRaw : {};

  let stainTips: string[] = [];

  if (stains.length > 0 && fabric) {
    const tips = await generateStainRemovalTipsCached(stains[0], fabric);
    stainTips = Array.isArray(tips)
      ? tips.filter((s) => typeof s === "string")
      : [];
  }

  return {
    imageHash: hash,
    canonical,
    translated,
    stainTips,
  };
}