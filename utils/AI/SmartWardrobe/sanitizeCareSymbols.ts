// utils/SmartWardrobe/sanitizeCareSymbols.ts

// Τα valid enums που υποστηρίζει το app
export const VALID_CARE_SYMBOLS = [
  "WashAt30",
  "WashAt40",
  "WashCold",
  "DoNotWash",
  "DoNotBleach",
  "TumbleDryLow",
  "TumbleDryMedium",
  "DoNotTumbleDry",
  "IronLow",
  "IronMedium",
  "IronHigh",
  "DoNotIron",
  "DryClean",
  "DoNotDryClean",
];

export function sanitizeCareSymbols(symbols: string[]): string[] {
  if (!Array.isArray(symbols)) return [];

  return symbols
    .map((s) => normalizeSymbol(s))
    .filter((s) => VALID_CARE_SYMBOLS.includes(s));
}

// Μετατρέπει διάφορες μορφές σε canonical enum
function normalizeSymbol(raw: string): string {
  if (!raw) return "";

  const v = raw.trim().toLowerCase();

  // Common AI outputs → canonical enums
  if (v.includes("30")) return "WashAt30";
  if (v.includes("40")) return "WashAt40";
  if (v.includes("cold")) return "WashCold";
  if (v.includes("no wash") || v.includes("do not wash")) return "DoNotWash";

  if (v.includes("bleach")) return "DoNotBleach";

  if (v.includes("tumble") && v.includes("low")) return "TumbleDryLow";
  if (v.includes("tumble") && v.includes("medium")) return "TumbleDryMedium";
  if (v.includes("no tumble") || v.includes("do not tumble")) return "DoNotTumbleDry";

  if (v.includes("iron") && v.includes("low")) return "IronLow";
  if (v.includes("iron") && v.includes("medium")) return "IronMedium";
  if (v.includes("iron") && v.includes("high")) return "IronHigh";
  if (v.includes("no iron") || v.includes("do not iron")) return "DoNotIron";

  if (v.includes("dry clean")) return "DryClean";
  if (v.includes("no dry clean") || v.includes("do not dry clean")) return "DoNotDryClean";

  return "";
}