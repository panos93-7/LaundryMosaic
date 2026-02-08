// utils/SmartWardrobe/wardrobeNormalize.ts
import { sanitizeCareSymbols } from "./sanitizeCareSymbols";
import { WardrobeCanonical } from "./wardrobeCanonical";


export function wardrobeNormalize(raw: any): WardrobeCanonical {
  if (!raw || typeof raw !== "object") {
    return EMPTY_CANONICAL;
  }

  return {
    name: clean(raw.name),
    type: clean(raw.type),
    category: clean(raw.category),
    fabric: clean(raw.fabric),
    color: clean(raw.color),
    pattern: clean(raw.pattern),

    stains: arr(raw.stains),
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
      shrinkage: clean(raw?.risks?.shrinkage),
      colorBleeding: clean(raw?.risks?.colorBleeding),
      delicacy: clean(raw?.risks?.delicacy),
    },

    washFrequency: clean(raw.washFrequency),
    careSymbols: sanitizeCareSymbols(raw.careSymbols),


    __locale: raw.__locale || "en",
  };
}

const clean = (v: any) =>
  typeof v === "string" ? v.trim() : "";

const arr = (v: any) =>
  Array.isArray(v) ? v.map(clean) : [];

const num = (v: any, fallback: number) =>
  typeof v === "number" ? v : fallback;

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