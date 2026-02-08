import { generateStainRemovalTips } from "./aiStainRemoval";
import { stainTipsCache } from "./stainTipsCache";

function normalizeTips(raw: any): string[] {
  try {
    if (!raw) return [];

    if (Array.isArray(raw?.steps)) {
      return raw.steps.filter((x: any) => typeof x === "string");
    }

    if (Array.isArray(raw?.tips)) {
      return raw.tips.filter((x: any) => typeof x === "string");
    }

    if (Array.isArray(raw)) {
      return raw.filter((x: any) => typeof x === "string");
    }

    if (typeof raw === "string") {
      return [raw];
    }

    if (typeof raw?.tip === "string") {
      return [raw.tip];
    }

    return [];
  } catch (err) {
    console.log("❌ normalizeTips error:", err);
    return [];
  }
}

export async function generateStainRemovalTipsCached(
  stain: string,
  fabric: string
) {
  try {
    // 1) Cache lookup
    const cached = await stainTipsCache.get(stain, fabric);
    if (cached) {
      console.log("⚡ Using cached stain tips");
      return normalizeTips(cached);
    }

    // 2) AI call
    let result: any = null;
    try {
      result = await generateStainRemovalTips(stain, fabric);
    } catch (err) {
      console.log("❌ generateStainRemovalTips network error:", err);
      return [];
    }

    // 3) Normalize BEFORE saving
    const normalized = normalizeTips(result);

    // 4) Save normalized
    await stainTipsCache.set(stain, fabric, normalized);

    return normalized;
  } catch (err) {
    console.log("❌ generateStainRemovalTipsCached fatal error:", err);
    return [];
  }
}