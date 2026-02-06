import * as Crypto from "expo-crypto";

export async function hashQuery(query: string) {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    query.trim().toLowerCase()
  );
}