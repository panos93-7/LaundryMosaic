// utils/SmartWardrobe/analyzeWardrobeCached.ts
import { preprocessImage } from "../Core/preprocessImage";
import { analyzeWardrobeImage } from "./analyzeWardrobeImage";
import { wardrobeCacheGet, wardrobeCacheSet } from "./wardrobeCache";
import { wardrobeCanonicalKey } from "./wardrobeCanonical";
import { wardrobeNormalize } from "./wardrobeNormalize";

export async function analyzeWardrobeCached(uri: string) {
  const { base64, mimeType } = await preprocessImage(uri);

  const raw = await analyzeWardrobeImage(base64, mimeType);
  const canonical = wardrobeNormalize(raw);

  const key = wardrobeCanonicalKey(canonical);

  const cached = await wardrobeCacheGet(key);
  if (cached) return cached;

  await wardrobeCacheSet(key, canonical);
  return canonical;
}