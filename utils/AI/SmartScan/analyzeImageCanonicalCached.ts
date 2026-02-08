import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { analyzeImageCanonical } from "./analyzeImageCanonical";

const MEMORY_CACHE: Record<string, any> = {};

function hashBase64(base64: string) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    base64
  );
}

export async function analyzeImageCanonicalCached(
  cleanedBase64: string,
  options: { signal?: AbortSignal } = {}
) {
  const { signal } = options;

  try {
    /* ---------------------------------------------------------------------- */
    /* 1) HASH CLEANED BASE64 (DETERMINISTIC)                                 */
    /* ---------------------------------------------------------------------- */
    const hash = await hashBase64(cleanedBase64);
    const cacheKey = `canonical:${hash}`;

    /* ---------------------------------------------------------------------- */
    /* 2) MEMORY CACHE                                                        */
    /* ---------------------------------------------------------------------- */
    if (MEMORY_CACHE[cacheKey]) {
      console.log("⚡ MEMORY CACHE HIT");
      return MEMORY_CACHE[cacheKey];
    }

    /* ---------------------------------------------------------------------- */
    /* 3) PERSISTENT CACHE (ASYNC STORAGE)                                    */
    /* ---------------------------------------------------------------------- */
    const stored = await AsyncStorage.getItem(cacheKey);
    if (stored) {
      console.log("💾 PERSISTENT CACHE HIT");
      const parsed = JSON.parse(stored);
      MEMORY_CACHE[cacheKey] = parsed;
      return parsed;
    }

    /* ---------------------------------------------------------------------- */
    /* 4) RUN AI ANALYSIS (NO CACHE HIT)                                      */
    /* ---------------------------------------------------------------------- */
    console.log("🧠 RUNNING AI ANALYSIS (NO CACHE)");
    const canonical = await analyzeImageCanonical(cleanedBase64, { signal });

    if (!canonical) return null;

    const result = { canonical, hash };

    /* ---------------------------------------------------------------------- */
    /* 5) SAVE TO CACHE                                                       */
    /* ---------------------------------------------------------------------- */
    MEMORY_CACHE[cacheKey] = result;
    await AsyncStorage.setItem(cacheKey, JSON.stringify(result));

    return result;
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.log("⛔ analyzeImageCanonicalCached aborted");
      return null;
    }

    console.log("❌ analyzeImageCanonicalCached fatal error:", err);
    return null;
  }
}