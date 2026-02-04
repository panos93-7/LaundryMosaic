import AsyncStorage from "@react-native-async-storage/async-storage";

const MEMORY_CACHE: Record<string, any> = {};

export async function aiCacheGet(hash: string) {
  if (MEMORY_CACHE[hash]) {
    // SAFETY FIX
    if (!Array.isArray(MEMORY_CACHE[hash].stainTips)) {
      MEMORY_CACHE[hash].stainTips = [];
    }
    return MEMORY_CACHE[hash];
  }

  try {
    const stored = await AsyncStorage.getItem("AI_CACHE_" + hash);
    if (stored) {
      const parsed = JSON.parse(stored);

      // SAFETY FIX
      if (!Array.isArray(parsed.stainTips)) {
        parsed.stainTips = [];
      }

      MEMORY_CACHE[hash] = parsed;
      return parsed;
    }
  } catch {}

  return null;
}

export async function aiCacheSet(hash: string, value: any) {
  // SAFETY FIX
  if (!Array.isArray(value.stainTips)) {
    value.stainTips = [];
  }

  MEMORY_CACHE[hash] = value;

  try {
    await AsyncStorage.setItem("AI_CACHE_" + hash, JSON.stringify(value));
  } catch {}
}