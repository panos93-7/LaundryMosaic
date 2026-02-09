// utils/SmartWardrobe/analyzeWardrobeCached.ts

import { preprocessImage } from "../Core/preprocessImage";
import { analyzeWardrobeImage } from "./analyzeWardrobeImage";

export async function analyzeWardrobeCached(uri: string) {
  console.log("⏱️ preprocess start");
  const { base64, mimeType } = await preprocessImage(uri);
  console.log("⏱️ preprocess end");

  console.log("⏱️ analyze start");
  const raw = await analyzeWardrobeImage(base64, mimeType);
  console.log("⏱️ analyze end");

  if (!raw) {
    console.log("❌ analyzeWardrobeCached: Vision returned null");
    return null;
  }

  return raw;
}