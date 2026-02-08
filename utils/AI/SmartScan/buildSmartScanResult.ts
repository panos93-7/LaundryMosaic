import { analyzeImageCanonicalCached } from "./analyzeImageCanonicalCached";
import { generateStainRemovalTipsCached } from "./generateStainRemovalTips";
import { translateCanonical } from "./translateCanonical";

export async function buildSmartScanResult(
  base64: string,
  options: { signal?: AbortSignal } = {}
) {
  const { signal } = options;

  try {
    /* ---------------------------------------------------------------------- */
    /* 1) CANONICAL ANALYSIS (CACHED)                                         */
    /* ---------------------------------------------------------------------- */
    const canonicalResult = await analyzeImageCanonicalCached(base64, { signal });
    if (!canonicalResult) return null;

    const { canonical, hash } = canonicalResult;

    if (!canonical || typeof canonical !== "object") return null;

    /* ---------------------------------------------------------------------- */
    /* 2) NORMALIZE STAINS                                                    */
    /* ---------------------------------------------------------------------- */
    const stains: string[] = Array.isArray(canonical.stains)
      ? canonical.stains
          .map((s: any) =>
            typeof s === "string"
              ? s.trim()
              : typeof s?.type === "string"
              ? s.type.trim()
              : ""
          )
          .filter((x: string) => x.length > 0)
      : [];

    const fabric: string =
      typeof canonical.fabric === "string" ? canonical.fabric.trim() : "";

    /* ---------------------------------------------------------------------- */
    /* 3) TRANSLATE CANONICAL (CACHED)                                        */
    /* ---------------------------------------------------------------------- */
    const translatedRaw = await translateCanonical(canonical, hash, { signal });

    const translated =
      translatedRaw && typeof translatedRaw === "object" ? translatedRaw : {};

    /* ---------------------------------------------------------------------- */
    /* 4) STAIN TIPS (CACHED)                                                 */
    /* ---------------------------------------------------------------------- */
    let stainTips: string[] = [];

    if (stains.length > 0 && fabric) {
      const tips = await generateStainRemovalTipsCached(stains[0], fabric, {
        signal,
      });

      const steps: string[] = Array.isArray(tips?.steps)
        ? tips.steps
        : Array.isArray(tips)
        ? tips
        : [];

      stainTips = steps
        .filter((s: string) => typeof s === "string" && s.trim().length > 0)
        .map((s: string) => s.trim());
    }

    /* ---------------------------------------------------------------------- */
    /* 5) FINAL STRUCTURED OUTPUT                                             */
    /* ---------------------------------------------------------------------- */
    return {
      imageHash: hash,
      canonical,
      translated,
      stainTips,
    };
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.log("⛔ buildSmartScanResult aborted");
      return null;
    }

    console.log("❌ buildSmartScanResult fatal error:", err);
    return null;
  }
}