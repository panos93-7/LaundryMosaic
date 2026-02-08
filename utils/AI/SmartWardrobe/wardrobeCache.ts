// utils/SmartWardrobe/wardrobeCache.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

const VERSION = "v1";
const PREFIX = "@wardrobe:";

export async function wardrobeCacheGet(key: string) {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + VERSION + ":" + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function wardrobeCacheSet(key: string, value: any) {
  try {
    await AsyncStorage.setItem(
      PREFIX + VERSION + ":" + key,
      JSON.stringify(value)
    );
  } catch {}
}