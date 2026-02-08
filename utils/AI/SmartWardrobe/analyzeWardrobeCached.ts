// utils/SmartWardrobe/analyzeWardrobeCached.ts
import { preprocessImage } from "../Core/preprocessImage";
import { analyzeWardrobeImage } from "./analyzeWardrobeImage";
import { wardrobeCacheGet, wardrobeCacheSet } from "./wardrobeCache";
import { wardrobeCanonicalKey } from "./wardrobeCanonical";
import { wardrobeNormalize } from "./wardrobeNormalize";

export async function analyzeWardrobeCached(uri: string) {
  console.log("⏱️ preprocess start");
const { base64, mimeType } = await preprocessImage(uri);
console.log("⏱️ preprocess end");

console.log("⏱️ analyze start");
const raw = await analyzeWardrobeImage(base64, mimeType);
console.log("⏱️ analyze end");

console.log("⏱️ normalize + hash start");
const canonical = wardrobeNormalize(raw);
const key = await wardrobeCanonicalKey(canonical);
console.log("⏱️ normalize + hash end");

console.log("⏱️ cache get start");
const cached = await wardrobeCacheGet(key);
console.log("⏱️ cache get end");
  if (cached) return cached;

  await wardrobeCacheSet(key, canonical);
  return canonical;
}