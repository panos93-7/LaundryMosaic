// utils/BatchScan/batchNormalize.ts

import { BatchItemCanonical } from "./batchCanonical";

export function batchNormalize(item: any): BatchItemCanonical | null {
  if (!item || typeof item !== "object") return null;

  return {
    id: String(item.id || Math.random().toString(36).slice(2)),
    fabric: normalize(item.fabric),
    color: normalize(item.color),
    risk: Array.isArray(item.risk) ? item.risk.map(normalize) : [],
    compatibleWith: Array.isArray(item.compatibleWith)
      ? item.compatibleWith.map(normalize)
      : [],
    incompatibleWith: Array.isArray(item.incompatibleWith)
      ? item.incompatibleWith.map(normalize)
      : [],
  };
}

function normalize(v: any) {
  return typeof v === "string" ? v.toLowerCase().trim() : "unknown";
}