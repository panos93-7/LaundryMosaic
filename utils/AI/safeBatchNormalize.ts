// utils/AI/safeBatchNormalize.ts

export function safeBatchNormalize(item: any) {
  if (!item || typeof item !== "object") {
    return null;
  }

  // fabric normalization
  let fabric = "unknown";

  if (typeof item.fabric === "string") {
    fabric = item.fabric.toLowerCase();
  }

  if (Array.isArray(item.fabric) && item.fabric.length > 0) {
    // dominant fabric = first
    const first = item.fabric[0];
    if (typeof first === "string") {
      fabric = first.toLowerCase();
    }
  }

  // ignore background objects
  const allowed = ["cotton", "wool", "linen", "silk", "synthetics", "delicate", "denim", "unknown"];

  if (!allowed.includes(fabric)) {
    return null;
  }

  return {
    fabric,
  };
}