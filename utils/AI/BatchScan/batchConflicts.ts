// utils/BatchScan/batchConflicts.ts

import { BatchItemCanonical } from "./batchCanonical";

export function batchConflicts(items: BatchItemCanonical[]) {
  const fabrics = items.map((i) => i.fabric);
  const conflicts: string[] = [];

  if (fabrics.includes("wool") && fabrics.some((f) => f !== "wool")) {
    conflicts.push("Wool should not be mixed with other fabrics.");
  }

  if (fabrics.includes("delicate") && fabrics.some((f) => f !== "delicate")) {
    conflicts.push("Delicates require separate washing.");
  }

  if (fabrics.includes("dark") && fabrics.includes("white")) {
    conflicts.push("Avoid mixing dark and white items.");
  }

  return conflicts;
}