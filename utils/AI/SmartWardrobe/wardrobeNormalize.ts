// utils/SmartWardrobe/wardrobeNormalize.ts
import { WardrobeCanonical } from "./wardrobeCanonical";

/* ---------------------------------------------------------
   NORMALIZATION MAPS (deterministic)
--------------------------------------------------------- */

const COLOR_MAP: Record<string, string> = {
  "light blue": "Light Blue",
  "sky blue": "Light Blue",
  "baby blue": "Light Blue",
  "light grey": "Light Gray",
  "light gray": "Light Gray",
  grey: "Gray",
  gray: "Gray",
  "dark grey": "Dark Gray",
  "dark gray": "Dark Gray",
  black: "Black",
  white: "White",
  cream: "Cream",
  beige: "Beige",
};

const TYPE_FORGIVING: Record<string, string> = {
  sweatshirt: "Sweatshirt",
  hoodie: "Sweatshirt",
  pullover: "Sweatshirt",
  crewneck: "Sweatshirt",
  knitwear: "Sweatshirt",
  knit: "Sweatshirt",
  jumper: "Sweatshirt",
  sweater: "Sweatshirt",
  "long-sleeve": "Sweatshirt",
  top: "Sweatshirt",
  "t-shirt": "T-Shirt",
  tee: "T-Shirt",
  shirt: "Shirt",
  blouse: "Blouse",
};

const CATEGORY_FORGIVING: Record<string, string> = {
  top: "Tops",
  tops: "Tops",
  shirt: "Tops",
  shirts: "Tops",
  "t-shirt": "Tops",
  "t-shirts": "Tops",
  sweatshirt: "Tops",
  sweatshirts: "Tops",
  hoodie: "Tops",
  hoodies: "Tops",
  knit: "Tops",
  knitwear: "Tops",
  pullover: "Tops",
  crewneck: "Tops",
};

const FABRIC_FORGIVING: Record<string, string> = {
  cotton: "Cotton Blend",
  "cotton blend": "Cotton Blend",
  "cotton knit": "Cotton Blend",
  "cotton mix": "Cotton Blend",
  "cotton fabric": "Cotton Blend",
  "cotton blend knit": "Cotton Blend",
};

const RISK_MAP: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const WASH_FREQ_MAP: Record<string, string> = {
  "after 1 wear": "After 1 wear",
  "1 wear": "After 1 wear",
  "after 2-3 wears": "After 2-3 wears",
  "2-3 wears": "After 2-3 wears",
  "every 2-3 wears": "After 2-3 wears",
  "after 3-4 wears": "After 3-4 wears",
  "3-4 wears": "After 3-4 wears",
  "after 4-5 wears": "After 4-5 wears",
  "4-5 wears": "After 4-5 wears",
};

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

const clean = (v: any) => (typeof v === "string" ? v.trim() : "");
const arr = (v: any) => (Array.isArray(v) ? v.map(clean) : []);
const num = (v: any, fallback: number) => (typeof v === "number" ? v : fallback);

function forgivingMap(raw: any, map: Record<string, string>, fallback = "Unknown") {
  const v = clean(raw).toLowerCase();
  for (const key of Object.keys(map)) {
    if (v.includes(key)) return map[key];
  }
  return fallback;
}

function normalizeColor(raw: any) {
  return forgivingMap(raw, COLOR_MAP, "Unknown");
}

function normalizeType(raw: any) {
  return forgivingMap(raw, TYPE_FORGIVING, "Unknown");
}

function normalizeCategory(raw: any) {
  return forgivingMap(raw, CATEGORY_FORGIVING, "Tops");
}

function normalizeFabric(raw: any) {
  return forgivingMap(raw, FABRIC_FORGIVING, clean(raw));
}

function normalizeRisk(raw: any) {
  return forgivingMap(raw, RISK_MAP, "Unknown");
}

function normalizeWashFrequency(raw: any) {
  return forgivingMap(raw, WASH_FREQ_MAP, "Unknown");
}

function normalizeStains(stains: any) {
  const list = arr(stains).map((s) => s.toLowerCase());
  if (list.some((s) => s.includes("dark"))) return ["Dark spots"];
  if (list.some((s) => s.includes("oil"))) return ["Oil stain"];
  if (list.some((s) => s.includes("makeup"))) return ["Makeup stain"];
  return list.length ? ["General stain"] : [];
}

/* ---------------------------------------------------------
   CARE SYMBOLS — deterministic
--------------------------------------------------------- */

function normalizeCareSymbols(symbols: any) {
  const list = arr(symbols).map((s) => s.toLowerCase());
  const out = new Set<string>();

  for (const s of list) {
    if (s.includes("30")) out.add("WashAt30");
    if (s.includes("40")) out.add("WashAt40");

    if (
      s.includes("donotbleach") ||
      s.includes("do not bleach") ||
      s.includes("no bleach")
    ) {
      out.add("DoNotBleach");
    }

    if (s.includes("tumble") && s.includes("low")) out.add("TumbleDryLow");
    if (s.includes("tumble") && s.includes("medium")) out.add("TumbleDryMedium");

    if (
      s.includes("donotdryclean") ||
      s.includes("do not dry clean") ||
      s.includes("no dry clean")
    ) {
      out.add("DoNotDryClean");
    }

    if (s.includes("iron")) {
      if (s.includes("low")) out.add("IronLow");
      else if (s.includes("medium")) out.add("IronMedium");
      else if (s.includes("high")) out.add("IronHigh");
      else out.add("IronLow");
    }
  }

  return Array.from(out);
}

/* ---------------------------------------------------------
   CARE FIELDS — derive ONLY from careSymbols
--------------------------------------------------------- */

function deriveCareFields(symbols: string[]) {
  const set = new Set(symbols);

  return {
    wash: set.has("WashAt30")
      ? "WashAt30"
      : set.has("WashAt40")
      ? "WashAt40"
      : set.has("WashCold")
      ? "WashCold"
      : set.has("DoNotWash")
      ? "DoNotWash"
      : "",

    bleach: set.has("DoNotBleach") ? "DoNotBleach" : "",

    dry: set.has("TumbleDryLow")
      ? "TumbleDryLow"
      : set.has("TumbleDryMedium")
      ? "TumbleDryMedium"
      : set.has("DoNotTumbleDry")
      ? "DoNotTumbleDry"
      : "",

    iron: set.has("IronLow")
      ? "IronLow"
      : set.has("IronMedium")
      ? "IronMedium"
      : set.has("IronHigh")
      ? "IronHigh"
      : set.has("DoNotIron")
      ? "DoNotIron"
      : "",

    dryclean: set.has("DoNotDryClean")
      ? "DoNotDryClean"
      : set.has("DryClean")
      ? "DryClean"
      : "",

    warnings: [], // warnings μένουν όπως είναι
  };
}

/* ---------------------------------------------------------
   DETERMINISTIC NAME
--------------------------------------------------------- */

function buildName(type: string, color: string) {
  if (!type && !color) return "";
  if (!type) return color;
  if (!color) return type;
  return `${color} ${type}`;
}

/* ---------------------------------------------------------
   MAIN NORMALIZER
--------------------------------------------------------- */

export function wardrobeNormalize(raw: any): WardrobeCanonical {
  if (!raw || typeof raw !== "object") {
    return EMPTY_CANONICAL;
  }

  const type = normalizeType(raw.type);
  const color = normalizeColor(raw.color);

  const careSymbols = normalizeCareSymbols(raw.careSymbols);

  return {
    name: buildName(type, color),

    type,
    category: normalizeCategory(raw.category),
    fabric: normalizeFabric(raw.fabric),
    color,
    pattern: clean(raw.pattern),

    stains: normalizeStains(raw.stains),
    stainTips: arr(raw.stainTips),

    recommended: {
      program: forgivingMap(raw?.recommended?.program, { cotton: "Cotton", cottons: "Cotton" }, "Cotton"),
      temp: num(raw?.recommended?.temp, 30),
      spin: num(raw?.recommended?.spin, 800),
      detergent: clean(raw?.recommended?.detergent),
      notes: arr(raw?.recommended?.notes),
    },

    care: deriveCareFields(careSymbols),

    risks: {
      shrinkage: normalizeRisk(raw?.risks?.shrinkage),
      colorBleeding: normalizeRisk(raw?.risks?.colorBleeding),
      delicacy: normalizeRisk(raw?.risks?.delicacy),
    },

    washFrequency: normalizeWashFrequency(raw.washFrequency),
    careSymbols,

    __locale: raw.__locale || "en",
  };
}

export const EMPTY_CANONICAL: WardrobeCanonical = {
  name: "",
  type: "",
  category: "",
  fabric: "",
  color: "",
  pattern: "",
  stains: [],
  stainTips: [],
  recommended: {
    program: "",
    temp: 30,
    spin: 800,
    detergent: "",
    notes: [],
  },
  care: {
    wash: "",
    bleach: "",
    dry: "",
    iron: "",
    dryclean: "",
    warnings: [],
  },
  risks: {
    shrinkage: "",
    colorBleeding: "",
    delicacy: "",
  },
  washFrequency: "",
  careSymbols: [],
};