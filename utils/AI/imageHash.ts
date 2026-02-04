import * as Crypto from "expo-crypto";

export async function getImageHash(base64: string) {
  const cleaned = base64
    .replace(/^data:.*;base64,/, "")
    .replace(/\s/g, "")
    .trim();

  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    cleaned
  );
}