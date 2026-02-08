import AsyncStorage from "@react-native-async-storage/async-storage";
import { AI_CACHE_VERSION } from "../Core/aiCache";
import { analyzeImageCanonical } from "./analyzeImageCanonical";

const MEMORY = new Map<string, any>();

const makeKey = (hash: string) =>
  `v${AI_CACHE_VERSION}:canonical:${hash}`;

export async function analyzeImageCanonicalCached(
  base64: string,
  options: { signal?: AbortSignal } = {}
) {
  const { signal } = options;

  try {
    // Hash the image for deterministic caching
    const hash = await hashBase64(base64);

    const key = makeKey(hash);

    // 1) Memory cache
    if (MEMORY.has(key)) {
      return MEMORY.get(key);
    }

    // 2) Persistent cache
    const json = await AsyncStorage.getItem(key);
    if (json) {
      const parsed = JSON.parse(json);
      MEMORY.set(key, parsed);
      return parsed;
    }

    // 3) Fresh analysis
    const canonical = await analyzeImageCanonical(base64, { signal });
    if (!canonical) return null;

    const result = { canonical, hash };

    // Save to caches
    MEMORY.set(key, result);
    await AsyncStorage.setItem(key, JSON.stringify(result));

    return result;
  } catch (err: any) {
    if (err?.name === "AbortError") return null;
    return null;
  }
}

async function hashBase64(base64: string) {
  const msgUint8 = new TextEncoder().encode(base64);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}