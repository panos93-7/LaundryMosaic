// utils/BatchScan/batchGroup.ts

import { BatchItemCanonical } from "./batchCanonical";

export function batchGroup(items: BatchItemCanonical[]) {
  const map: Record<string, number> = {};

  items.forEach((it) => {
    if (!map[it.fabric]) map[it.fabric] = 0;
    map[it.fabric] += 1;
  });

  return Object.keys(map).map((fabric) => ({
    fabric,
    count: map[fabric],
  }));
}