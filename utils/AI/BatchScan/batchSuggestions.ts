// utils/BatchScan/batchSuggestions.ts

import { BatchItemCanonical } from "./batchCanonical";

export function batchSuggestions(items: BatchItemCanonical[]) {
  const fabrics = items.map((i) => i.fabric);
  const suggestions: string[] = [];

  if (fabrics.every((f) => f === "cotton")) {
    suggestions.push("You can wash all cotton items together.");
  }

  if (fabrics.every((f) => f === "synthetics")) {
    suggestions.push("Synthetics can be washed together safely.");
  }

  if (fabrics.length > 1) {
    suggestions.push("Mixed load detected. Use a gentle program.");
  }

  return suggestions;
}