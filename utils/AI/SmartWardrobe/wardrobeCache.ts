// utils/SmartWardrobe/wardrobeCache.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

const VERSION = "v2"; // ⭐ NEW VERSION — required after normalize changes
const PREFIX = "@wardrobe:";

export async function wardrobeCacheGet(key: string) {
  try {
    const storageKey = PREFIX + VERSION + ":" + key;
    const raw = await AsyncStorage.getItem(storageKey);

    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      return parsed;
    } catch {
      console.log("⚠️ wardrobeCacheGet: corrupted JSON for", storageKey);
      return null;
    }
  } catch (err) {
    console.log("⚠️ wardrobeCacheGet error:", err);
    return null;
  }
}

export async function wardrobeCacheSet(key: string, value: any) {
  try {
    const storageKey = PREFIX + VERSION + ":" + key;
    await AsyncStorage.setItem(storageKey, JSON.stringify(value));
  } catch (err) {
    console.log("⚠️ wardrobeCacheSet error:", err);
  }
}