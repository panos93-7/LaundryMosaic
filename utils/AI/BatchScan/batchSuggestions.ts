// utils/AI/BatchScan/batchSuggestions.ts

import { BatchItemCanonical } from "./batchCanonical";
import { translateBatchText } from "./translateBatch";

export async function batchSuggestions(
  items: BatchItemCanonical[],
  locale: string
) {
  const fabrics = items.map((i) => i.fabric);
  const suggestions: string[] = [];

  // Raw English suggestions (AI will translate)
  if (fabrics.every((f) => f === "cotton")) {
    suggestions.push("You can wash all cotton items together.");
  }

  if (fabrics.every((f) => f === "synthetics")) {
    suggestions.push("Synthetics can be washed together safely.");
  }

  if (fabrics.length > 1) {
    suggestions.push("Mixed load detected. Use a gentle program.");
  }

  // Translate all suggestions
  const translated = await Promise.all(
    suggestions.map((s) => translateBatchText(s, locale))
  );

  return translated;
}