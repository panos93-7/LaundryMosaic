import AsyncStorage from "@react-native-async-storage/async-storage";
import { AI_CACHE_VERSION } from "../Core/aiCache";

const MEMORY_CACHE = new Map<string, any>();

// ⭐ Versioned key
const makeKey = (stain: string, fabric: string) =>
  `v${AI_CACHE_VERSION}:stainTips:${stain}:${fabric}`;

export const stainTipsCache = {
  async get(stain: string, fabric: string) {
    const key = makeKey(stain, fabric);

    // 1) Memory cache
    if (MEMORY_CACHE.has(key)) {
      return MEMORY_CACHE.get(key);
    }

    // 2) Persistent cache
    const json = await AsyncStorage.getItem(key);
    if (!json) return null;

    const parsed = JSON.parse(json);
    MEMORY_CACHE.set(key, parsed);
    return parsed;
  },

  async set(stain: string, fabric: string, value: any) {
    const key = makeKey(stain, fabric);

    MEMORY_CACHE.set(key, value);
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }
};