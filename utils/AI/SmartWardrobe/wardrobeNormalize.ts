// utils/SmartWardrobe/wardrobeNormalize.ts
import { sanitizeCareSymbols } from "./sanitizeCareSymbols";
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
  "grey": "Gray",
  "gray": "Gray",
  "dark grey": "Dark Gray",
  "dark gray": "Dark Gray",
  "black": "Black",
  "white": "White",
  "cream": "Cream",
  "beige": "Beige",
};

const TYPE_MAP: Record<string, string> = {
  "sweatshirt": "Sweatshirt",
  "hoodie": "Sweatshirt",
  "pullover": "Sweatshirt",
  "t-shirt": "T-Shirt",
  "tee": "T-Shirt",
  "shirt": "Shirt",
  "blouse": "Blouse",
};

const CATEGORY_MAP: Record<string, string> = {
  "tops": "Tops",
  "shirts": "Tops",
  "t-shirts": "Tops",
  "sweatshirts": "Tops",
  "hoodies": "Tops",
};

const RISK_MAP: Record<string, string> = {
  "low": "Low",
  "medium": "Medium",
  "high": "High",
};

const WASH_FREQ_MAP: Record<string, string> = {
  "after 1 wear": "After 1 wear",
  "after 2-3 wears": "After 2-3 wears",
  "after 3-4 wears": "After 3-4 wears",
  "after 4-5 wears": "After 4-5 wears",
};

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

const clean = (v: any) =>
  typeof v === "string" ? v.trim() : "";

const arr = (v: any) =>
  Array.isArray(v) ? v.map(clean) : [];

const num = (v: any, fallback: number) =>
  typeof v === "number" ? v : fallback;

function normalizeFromMap(raw: any, map: Record<string, string>, fallback = "Unknown") {
  const v = clean(raw).toLowerCase();
  for (const key of Object.keys(map)) {
    if (v.includes(key)) return map[key];
  }
  return fallback;
}

function normalizeColor(raw: any) {
  return normalizeFromMap(raw, COLOR_MAP, "Unknown");
}

function normalizeType(raw: any) {
  return normalizeFromMap(raw, TYPE_MAP, "Unknown");
}

function normalizeCategory(raw: any) {
  return normalizeFromMap(raw, CATEGORY_MAP, "Unknown");
}

function normalizeRisk(raw: any) {
  return normalizeFromMap(raw, RISK_MAP, "Unknown");
}

function normalizeWashFrequency(raw: any) {
  return normalizeFromMap(raw, WASH_FREQ_MAP, "Unknown");
}

function normalizeStains(stains: any) {
  const list = arr(stains).map((s) => s.toLowerCase());
  if (list.some((s) => s.includes("dark"))) return ["Dark spots"];
  if (list.some((s) => s.includes("oil"))) return ["Oil stain"];
  if (list.some((s) => s.includes("makeup"))) return ["Makeup stain"];
  return list.length ? ["General stain"] : [];
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

  return {
    name: buildName(type, color), // ⭐ deterministic name

    type,
    category: normalizeCategory(raw.category),
    fabric: clean(raw.fabric),
    color,
    pattern: clean(raw.pattern),

    stains: normalizeStains(raw.stains),
    stainTips: arr(raw.stainTips),

    recommended: {
      program: clean(raw?.recommended?.program),
      temp: num(raw?.recommended?.temp, 30),
      spin: num(raw?.recommended?.spin, 800),
      detergent: clean(raw?.recommended?.detergent),
      notes: arr(raw?.recommended?.notes),
    },

    care: {
      wash: clean(raw?.care?.wash),
      bleach: clean(raw?.care?.bleach),
      dry: clean(raw?.care?.dry),
      iron: clean(raw?.care?.iron),
      dryclean: clean(raw?.care?.dryclean),
      warnings: arr(raw?.care?.warnings),
    },

    risks: {
      shrinkage: normalizeRisk(raw?.risks?.shrinkage),
      colorBleeding: normalizeRisk(raw?.risks?.colorBleeding),
      delicacy: normalizeRisk(raw?.risks?.delicacy),
    },

    washFrequency: normalizeWashFrequency(raw.washFrequency),
    careSymbols: sanitizeCareSymbols(raw.careSymbols),

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