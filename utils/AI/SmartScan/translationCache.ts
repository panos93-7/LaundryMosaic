import AsyncStorage from "@react-native-async-storage/async-storage";

const MEMORY = new Map<string, any>();

export const smartScanTranslationCache = {
  async get(key: string) {
    // 1) In‑memory cache
    if (MEMORY.has(key)) return MEMORY.get(key);

    // 2) Persistent cache
    const json = await AsyncStorage.getItem(key);
    if (!json) return null;

    const parsed = JSON.parse(json);
    MEMORY.set(key, parsed);
    return parsed;
  },

  async set(key: string, value: any) {
    MEMORY.set(key, value);
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }
};