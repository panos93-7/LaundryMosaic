import { analyzeImageCanonicalCached } from "./analyzeImageCanonicalCached";
import { generateStainRemovalTipsCached } from "./generateStainRemovalTips";
import { translateCanonical } from "./translateCanonical";

export async function buildSmartScanResult(base64: string) {
  // 1) Canonical (cached)
  const canonicalResult = await analyzeImageCanonicalCached(base64);
  if (!canonicalResult) return null;

  const { canonical, hash } = canonicalResult;

  // 2) Translation (cached per locale)
  const translated = await translateCanonical(canonical, hash);

  // 3) Stain removal (cached per stain+fabric)
  let stainTips: string[] = [];

  const stains = Array.isArray(canonical?.stains)
    ? canonical.stains
    : [];

  const fabric = canonical?.fabric || "";

  if (stains.length > 0 && fabric) {
    // Use the FIRST stain for SmartScan
    stainTips = await generateStainRemovalTipsCached(stains[0], fabric);
  }

  // 4) Final unified SmartScan result
  return {
    imageHash: hash,
    canonical,
    translated,
    stainTips
  };
}