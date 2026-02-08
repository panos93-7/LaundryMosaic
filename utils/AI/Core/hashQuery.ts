import * as Crypto from "expo-crypto";

export async function hashQuery(query: string) {
  if (!query) return "";

  // Normalize the query so the hash is stable across languages/locales
  const normalized = query
    .normalize("NFD")                // break accents
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .toLowerCase()
    .replace(/[^\p{L}\p{N} ]/gu, "") // remove punctuation
    .replace(/\s+/g, " ")            // collapse spaces
    .trim();

  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    normalized
  );
}