import { generateStainRemovalTips } from "../aiStainRemoval";
import { stainTipsCache } from "./stainTipsCache";

function normalizeTips(raw: any): string[] {
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
}

export async function generateStainRemovalTipsCached(
  stain: string,
  fabric: string
) {
  // 1) Check cache
  const cached = await stainTipsCache.get(stain, fabric);
  if (cached) {
    console.log("⚡ Using cached stain tips");
    return normalizeTips(cached);
  }

  // 2) AI call
  const result = await generateStainRemovalTips(stain, fabric);

  // 3) Normalize BEFORE saving
  const normalized = normalizeTips(result);

  // 4) Save normalized
  await stainTipsCache.set(stain, fabric, normalized);

  return normalized;
}