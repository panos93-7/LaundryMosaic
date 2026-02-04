import { generateStainRemovalTips } from "../aiStainRemoval";
import { stainTipsCache } from "./stainTipsCache";

export async function generateStainRemovalTipsCached(
  stain: string,
  fabric: string
) {
  // Unified cache key
  const key = `stain:${stain}:fabric:${fabric}`;

  // 1) Check persistent + memory cache
  const cached = await stainTipsCache.get(stain, fabric);
  if (cached) {
    console.log("⚡ Using cached stain tips");
    return cached;
  }

  // 2) Call AI
  const result = await generateStainRemovalTips(stain, fabric);

  // 3) Store in persistent + memory cache
  await stainTipsCache.set(stain, fabric, result);

  return result;
}