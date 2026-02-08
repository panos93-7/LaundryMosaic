import AsyncStorage from "@react-native-async-storage/async-storage";

// ⭐ GLOBAL VERSIONING — άλλαξε το σε "v2" όταν αλλάξει prompt/model/schema
export const AI_CACHE_VERSION = "v1";

const MEMORY_CACHE: Record<string, any> = {};

function ensureSafeGarment(obj: any) {
  if (!obj || typeof obj !== "object") return null;

  if (!Array.isArray(obj.stains)) obj.stains = [];

  if (!obj.recommended) {
    obj.recommended = {
      program: "",
      temp: 30,
      spin: 800,
      detergent: "",
      notes: [],
    };
  } else {
    if (!Array.isArray(obj.recommended.notes)) obj.recommended.notes = [];
    if (typeof obj.recommended.temp !== "number") obj.recommended.temp = 30;
    if (typeof obj.recommended.spin !== "number") obj.recommended.spin = 800;
  }

  if (!obj.care) {
    obj.care = {
      wash: "",
      bleach: "",
      dry: "",
      iron: "",
      dryclean: "",
      warnings: [],
    };
  } else {
    if (!Array.isArray(obj.care.warnings)) obj.care.warnings = [];
  }

  if (!obj.risks) {
    obj.risks = {
      shrinkage: "",
      colorBleeding: "",
      delicacy: "",
    };
  }

  if (!Array.isArray(obj.careSymbols)) obj.careSymbols = [];
  if (!Array.isArray(obj.stainTips)) obj.stainTips = [];

  return obj;
}

export async function aiCacheGet(hash: string) {
  const key = `AI_CACHE_${AI_CACHE_VERSION}_${hash}`;

  if (MEMORY_CACHE[key]) {
    const safe = ensureSafeGarment(MEMORY_CACHE[key]);
    MEMORY_CACHE[key] = safe;
    return safe;
  }

  try {
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      const safe = ensureSafeGarment(parsed);
      MEMORY_CACHE[key] = safe;
      return safe;
    }
  } catch {}

  return null;
}

export async function aiCacheSet(hash: string, value: any) {
  const key = `AI_CACHE_${AI_CACHE_VERSION}_${hash}`;
  const safe = ensureSafeGarment(value) ?? value;

  MEMORY_CACHE[key] = safe;

  try {
    await AsyncStorage.setItem(key, JSON.stringify(safe));
  } catch {}
}