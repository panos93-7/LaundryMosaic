// utils/BatchScan/analyzeBatchCached.ts
// BatchScan v2 — independent, canonical, cached, deterministic

import { preprocessImage } from "../Core/preprocessImage";
import { analyzeBatchImage } from "./analyzeBatchImage";
import { getBatchCache, setBatchCache } from "./batchCache";
import { BatchItemCanonical } from "./batchCanonical"; // ← ΑΥΤΟ ΕΛΕΙΠΕ
import { batchConflicts } from "./batchConflicts";
import { batchGroup } from "./batchGroup";
import { batchNormalize } from "./batchNormalize";
import { batchSuggestions } from "./batchSuggestions";

export async function analyzeBatchCached(uri: string) {
  // 1) Preprocess image (resize → jpeg → base64)
  const { base64, mimeType } = await preprocessImage(uri);

  // 2) Deterministic cache key
  const cacheKey = base64.slice(0, 200);

  // 3) Try cache first
  const cached = await getBatchCache(cacheKey);
  if (cached) return cached;

  // 4) AI call → returns raw items
  const aiItems = await analyzeBatchImage(base64, mimeType);

  // 5) Normalize → canonical schema
  const normalized = aiItems
    .map((it) => batchNormalize(it))
    .filter((x): x is BatchItemCanonical => x !== null);

  // 6) Build final result object
  const result = {
    total: normalized.length,
    groups: batchGroup(normalized),
    conflicts: batchConflicts(normalized),
    suggestions: batchSuggestions(normalized),
    items: normalized,
  };

  // 7) Save to cache
  await setBatchCache(cacheKey, result);

  return result;
}