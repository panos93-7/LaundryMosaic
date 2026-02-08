// utils/AI/AILaundryAssistant/aiLaundryCache.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AI_CACHE_VERSION } from "../Core/aiCache";

const MEMORY_CACHE = new Map<string, any>();

function makeKey(canonicalKey: string, subKey: string) {
  const raw = `v${AI_CACHE_VERSION}::laundry::${canonicalKey}::${subKey}`;
  return encodeURIComponent(raw);
}

export const aiLaundryCache = {
  async get(canonicalKey: string, subKey: string) {
    const key = makeKey(canonicalKey, subKey);

    if (MEMORY_CACHE.has(key)) {
      return MEMORY_CACHE.get(key);
    }

    const json = await AsyncStorage.getItem(key);
    if (!json) return null;

    const parsed = JSON.parse(json);
    MEMORY_CACHE.set(key, parsed);
    return parsed;
  },

  async set(canonicalKey: string, subKey: string, value: any) {
    const key = makeKey(canonicalKey, subKey);

    MEMORY_CACHE.set(key, value);
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
};