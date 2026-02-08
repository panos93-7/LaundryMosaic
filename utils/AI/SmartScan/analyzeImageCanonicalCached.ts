import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto"; // ⭐ FIX
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

    // Ensure base64 is a proper data URL
    const dataUrl = base64.startsWith("data:")
      ? base64
      : `data:image/jpeg;base64,${base64}`;

    // ⭐ FIX: Clean base64 before hashing (deterministic cache)
    const cleaned = base64
      .replace(/^data:.*;base64,/, "")
      .replace(/\s/g, "")
      .trim();

    // ⭐ FIX: Use expo‑crypto instead of crypto.subtle
    const hash = await hashBase64(cleaned);
    const key = makeKey(hash);

    // 1) Memory cache
    if (MEMORY.has(key)) {
      console.log("⚡ Memory cache hit");
      return MEMORY.get(key);
    }

    // 2) Persistent cache
    const json = await AsyncStorage.getItem(key);
    if (json) {
      console.log("💾 Persistent cache hit");
      const parsed = JSON.parse(json);
      MEMORY.set(key, parsed);
      return parsed;
    }

    // 3) Fresh analysis
    console.log("📦 Calling analyzeImageCanonical...");
    const canonical = await analyzeImageCanonical(dataUrl, { signal });
    console.log("📦 analyzeImageCanonical returned:", canonical);

    if (!canonical) return null;

    const result = { canonical, hash };

    // Save to caches
    MEMORY.set(key, result);
    await AsyncStorage.setItem(key, JSON.stringify(result));

    return result;
  } catch (err: any) {
    if (err?.name === "AbortError") return null;
    console.log("❌ analyzeImageCanonicalCached ERROR:", err);
    return null;
  }
}

// ⭐ FINAL FIX — expo‑crypto hashing
async function hashBase64(base64: string) {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    base64
  );
}