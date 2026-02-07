import AsyncStorage from "@react-native-async-storage/async-storage";
import { AI_CACHE_VERSION } from "./aiCache";

const MEMORY_CACHE = new Map<string, any>();

function makeKey(fabric: string, normalizedQuery: string, locale: string) {
  const raw = `raw::${fabric}::${normalizedQuery}::${locale}`;
  const encoded = encodeURIComponent(raw);
  return `v${AI_CACHE_VERSION}:laundry:${encoded}`;
}

export const aiLaundryCache = {
  async get(fabric: string, normalizedQuery: string, locale: string) {
    const key = makeKey(fabric, normalizedQuery, locale);

    if (MEMORY_CACHE.has(key)) {
      return MEMORY_CACHE.get(key);
    }

    const json = await AsyncStorage.getItem(key);
    if (!json) return null;

    const parsed = JSON.parse(json);
    MEMORY_CACHE.set(key, parsed);
    return parsed;
  },

  async set(fabric: string, normalizedQuery: string, locale: string, value: any) {
    const key = makeKey(fabric, normalizedQuery, locale);

    MEMORY_CACHE.set(key, value);
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }
};