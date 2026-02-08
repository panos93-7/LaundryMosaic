// utils/BatchScan/batchCache.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

const VERSION = "v1";
const PREFIX = "@batchscan:";

export async function getBatchCache(key: string) {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + VERSION + ":" + key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function setBatchCache(key: string, value: any) {
  try {
    await AsyncStorage.setItem(
      PREFIX + VERSION + ":" + key,
      JSON.stringify(value)
    );
  } catch {}
}