// utils/BatchScan/analyzeBatchCached.ts
// BatchScan v2 — independent, canonical, cached, deterministic

import i18n from "../../../i18n";
import { preprocessImage } from "../Core/preprocessImage";
import { analyzeBatchImage } from "./analyzeBatchImage";
import { getBatchCache, setBatchCache } from "./batchCache";
import { BatchItemCanonical } from "./batchCanonical";
import { batchConflicts } from "./batchConflicts";
import { batchGroup } from "./batchGroup";
import { batchNormalize } from "./batchNormalize";
import { batchSuggestions } from "./batchSuggestions";

export async function analyzeBatchCached(uri: string) {
  // 1) Preprocess image (resize → jpeg → base64)
  const { base64, mimeType } = await preprocessImage(uri);

  // Detect locale (ΠΡΕΠΕΙ ΝΑ ΕΙΝΑΙ ΠΡΙΝ ΤΟ CACHE KEY)
  const rawLocale = String(i18n.locale || "en");
  const locale = rawLocale.split("-")[0];

  // 2) Deterministic cache key (language‑aware)
  const cacheKey = `${base64.slice(0, 200)}:${locale}`;

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
    groups: await batchGroup(normalized, locale),
    conflicts: batchConflicts(normalized),
    suggestions: await batchSuggestions(normalized, locale),
    items: normalized,
  };

  // 7) Save to cache
  await setBatchCache(cacheKey, result);

  return result;
}