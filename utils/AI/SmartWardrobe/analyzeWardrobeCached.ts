// utils/SmartWardrobe/analyzeWardrobeCached.ts

import { preprocessImage } from "../Core/preprocessImage";
import { analyzeWardrobeImage } from "./analyzeWardrobeImage";
import { wardrobeCacheGet, wardrobeCacheSet } from "./wardrobeCache";
import { wardrobeCanonicalKey } from "./wardrobeCanonical";
import { wardrobeNormalize } from "./wardrobeNormalize";

export async function analyzeWardrobeCached(uri: string) {
  console.log("⏱️ preprocess start");
  const { base64, mimeType } = await preprocessImage(uri);
  console.log("⏱️ preprocess end");

  console.log("⏱️ analyze start");
  const raw = await analyzeWardrobeImage(base64, mimeType);
  console.log("⏱️ analyze end");

  if (!raw) {
    console.log("❌ analyzeWardrobeCached: Vision returned null");
    return null;
  }

  console.log("⏱️ normalize + hash start");
  const canonical = wardrobeNormalize(raw);
  const key = await wardrobeCanonicalKey(canonical);
  console.log("⏱️ normalize + hash end");

  // Prevent caching empty canonical
  if (!canonical.type && !canonical.color && canonical.careSymbols.length === 0) {
    console.log("⚠️ Skipping cache: canonical is empty");
    return canonical;
  }

  console.log("⏱️ cache get start");
  const cached = await wardrobeCacheGet(key);
  console.log("⏱️ cache get end");

  if (cached) {
    console.log("🌍 HIT wardrobe cache for", key);
    return cached;
  }

  console.log("🌍 MISS wardrobe cache → storing", key);
  await wardrobeCacheSet(key, canonical);

  return canonical;
}