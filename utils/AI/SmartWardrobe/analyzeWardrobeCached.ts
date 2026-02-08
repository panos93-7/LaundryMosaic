// utils/SmartWardrobe/analyzeWardrobeCached.ts

import { preprocessImage } from "../Core/preprocessImage";
import { analyzeWardrobeImage } from "./analyzeWardrobeImage";
import { wardrobeCacheGet, wardrobeCacheSet } from "./wardrobeCache";
import { wardrobeNormalize } from "./wardrobeNormalize";

export async function analyzeWardrobeCached(uri: string) {
  const { base64, mimeType } = await preprocessImage(uri);

  const hash = base64.slice(0, 200);

  const cached = await wardrobeCacheGet(hash);
  if (cached) return cached;

  const raw = await analyzeWardrobeImage(base64, mimeType);
  const normalized = wardrobeNormalize(raw);

  await wardrobeCacheSet(hash, normalized);

  return normalized;
}