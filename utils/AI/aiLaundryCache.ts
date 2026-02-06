import AsyncStorage from "@react-native-async-storage/async-storage";
import { AI_CACHE_VERSION } from "./aiCache";

const MEMORY_CACHE = new Map<string, any>();

// Safely stringify history arrays or objects
function safeStringify(input: any) {
  try {
    return JSON.stringify(input);
  } catch {
    return String(input);
  }
}

/**
 * NEW KEY FORMAT (locale-agnostic):
 * vX:laundry:raw::<fabric>::<query>::<history>
 *
 * locale is NOT part of the key anymore
 */
function makeKey(fabric: string, query: string, history?: any) {
  const historyPart = history ? safeStringify(history) : "";
  const raw = `raw::${fabric}::${query}::${historyPart}`;
  const encoded = encodeURIComponent(raw);
  return `v${AI_CACHE_VERSION}:laundry:${encoded}`;
}

export const aiLaundryCache = {
  async get(fabric: string, query: string, history?: any) {
    const key = makeKey(fabric, query, history);

    if (MEMORY_CACHE.has(key)) {
      return MEMORY_CACHE.get(key);
    }

    const json = await AsyncStorage.getItem(key);
    if (!json) return null;

    const parsed = JSON.parse(json);
    MEMORY_CACHE.set(key, parsed);
    return parsed;
  },

  async set(fabric: string, query: string, history: any, value: any) {
    const key = makeKey(fabric, query, history);

    MEMORY_CACHE.set(key, value);
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }
};