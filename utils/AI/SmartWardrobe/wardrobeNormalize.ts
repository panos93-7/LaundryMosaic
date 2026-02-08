// utils/SmartWardrobe/wardrobeNormalize.ts

import { WardrobeCanonical } from "./wardrobeCanonical";

export function wardrobeNormalize(raw: any): WardrobeCanonical {
  if (!raw || typeof raw !== "object") {
    return EMPTY_CANONICAL;
  }

  return {
    name: raw.name || "",
    type: raw.type || "",
    category: raw.category || "",
    fabric: raw.fabric || "",
    color: raw.color || "",
    pattern: raw.pattern || "",

    stains: Array.isArray(raw.stains) ? raw.stains : [],
    stainTips: Array.isArray(raw.stainTips) ? raw.stainTips : [],

    recommended: {
      program: raw?.recommended?.program || "",
      temp: typeof raw?.recommended?.temp === "number" ? raw.recommended.temp : 30,
      spin: typeof raw?.recommended?.spin === "number" ? raw.recommended.spin : 800,
      detergent: raw?.recommended?.detergent || "",
      notes: Array.isArray(raw?.recommended?.notes) ? raw.recommended.notes : [],
    },

    care: {
      wash: raw?.care?.wash || "",
      bleach: raw?.care?.bleach || "",
      dry: raw?.care?.dry || "",
      iron: raw?.care?.iron || "",
      dryclean: raw?.care?.dryclean || "",
      warnings: Array.isArray(raw?.care?.warnings) ? raw.care.warnings : [],
    },

    risks: {
      shrinkage: raw?.risks?.shrinkage || "",
      colorBleeding: raw?.risks?.colorBleeding || "",
      delicacy: raw?.risks?.delicacy || "",
    },

    washFrequency: raw.washFrequency || "",
    careSymbols: Array.isArray(raw.careSymbols) ? raw.careSymbols : [],

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