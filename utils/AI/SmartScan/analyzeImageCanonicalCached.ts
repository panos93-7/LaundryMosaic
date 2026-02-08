import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto"; // ⭐ ΠΡΟΣΤΕΘΗΚΕ
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
    console.log("📸 analyzeImageCanonicalCached RECEIVED base64 length:", base64?.length);

    const dataUrl = base64.startsWith("data:")
      ? base64
      : `data:image/jpeg;base64,${base64}`;

    // ⭐ FIXED: χρησιμοποιούμε expo‑crypto αντί για crypto.subtle
    const hash = await hashBase64(base64);
    const key = makeKey(hash);

    if (MEMORY.has(key)) {
      return MEMORY.get(key);
    }

    const json = await AsyncStorage.getItem(key);
    if (json) {
      const parsed = JSON.parse(json);
      MEMORY.set(key, parsed);
      return parsed;
    }

    console.log("📦 Calling analyzeImageCanonical...");
    const canonical = await analyzeImageCanonical(dataUrl, { signal });
    console.log("📦 analyzeImageCanonical returned:", canonical);

    if (!canonical) return null;

    const result = { canonical, hash };

    MEMORY.set(key, result);
    await AsyncStorage.setItem(key, JSON.stringify(result));

    return result;
  } catch (err: any) {
    if (err?.name === "AbortError") return null;
    console.log("❌ analyzeImageCanonicalCached ERROR:", err);
    return null;
  }
}

// ⭐ ΤΕΛΙΚΟ FIX — expo‑crypto hashing
async function hashBase64(base64: string) {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    base64
  );
}