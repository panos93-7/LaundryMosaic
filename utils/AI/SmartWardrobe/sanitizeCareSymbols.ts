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

  const out = new Set<string>();

  for (const raw of symbols) {
    const s = normalizeSymbol(raw);
    if (VALID_CARE_SYMBOLS.includes(s)) {
      out.add(s);
    }
  }

  return Array.from(out);
}

// Μετατρέπει διάφορες μορφές σε canonical enum (FORGIVING + deterministic)
function normalizeSymbol(raw: string): string {
  if (!raw) return "";

  const v = raw.trim().toLowerCase();

  /* -----------------------------
     WASH
  ----------------------------- */
  if (v.includes("30")) return "WashAt30";
  if (v.includes("40")) return "WashAt40";
  if (v.includes("cold")) return "WashCold";
  if (v.includes("do not wash") || v.includes("no wash")) return "DoNotWash";

  /* -----------------------------
     BLEACH
  ----------------------------- */
  if (
    v.includes("do not bleach") ||
    v.includes("no bleach") ||
    v.includes("avoid bleach") ||
    v.includes("bleach not")
  ) {
    return "DoNotBleach";
  }

  /* -----------------------------
     TUMBLE DRY
  ----------------------------- */
  if (v.includes("tumble") || v.includes("dry")) {
    if (v.includes("low")) return "TumbleDryLow";
    if (v.includes("medium")) return "TumbleDryMedium";
    if (v.includes("do not tumble") || v.includes("no tumble")) {
      return "DoNotTumbleDry";
    }
  }

  /* -----------------------------
     IRON (default IronLow)
  ----------------------------- */
  if (v.includes("iron")) {
    if (v.includes("no iron") || v.includes("do not iron")) return "DoNotIron";
    if (v.includes("low")) return "IronLow";
    if (v.includes("medium")) return "IronMedium";
    if (v.includes("high")) return "IronHigh";

    // forgiving default
    return "IronLow";
  }

  /* -----------------------------
     DRY CLEAN
  ----------------------------- */
  if (v.includes("dry clean")) {
    if (v.includes("do not") || v.includes("no")) return "DoNotDryClean";
    return "DryClean";
  }

  return "";
}