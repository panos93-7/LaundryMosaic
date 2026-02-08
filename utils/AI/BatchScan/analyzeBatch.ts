// utils/BatchScan/analyzeBatch.ts

import i18n from "../../../i18n";
import { preprocessImage } from "../Core/preprocessImage";
import { analyzeBatchImage } from "./analyzeBatchImage";
import { getBatchCache, setBatchCache } from "./batchCache";
import { BatchItemCanonical } from "./batchCanonical";
import { batchConflicts } from "./batchConflicts";
import { batchGroup } from "./batchGroup";
import { batchNormalize } from "./batchNormalize";
import { batchSuggestions } from "./batchSuggestions";

export async function analyzeBatch(uri: string) {
  // 1) Preprocess image
  const { base64, mimeType } = await preprocessImage(uri);

  // 2) Deterministic cache key
  const hash = base64.slice(0, 200);

  // 3) Cache check
  const cached = await getBatchCache(hash);
  if (cached) return cached;

  // 4) AI call
  const aiItems = await analyzeBatchImage(base64, mimeType);

  // 5) Normalize → canonical schema
  const normalized = aiItems
    .map((it) => batchNormalize(it))
    .filter((x): x is BatchItemCanonical => x !== null);

  // Detect locale
  const rawLocale = String(i18n.locale || "en");
  const locale = rawLocale.split("-")[0];

  // 6) Build final result object
  const result = {
    total: normalized.length,
    groups: await batchGroup(normalized, locale),
    conflicts: batchConflicts(normalized),
    suggestions: await batchSuggestions(normalized, locale),
    items: normalized,
  };

  // 7) Save to cache
  await setBatchCache(hash, result);

  return result;
}