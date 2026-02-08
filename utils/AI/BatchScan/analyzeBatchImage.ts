// utils/BatchScan/analyzeBatchImage.ts

import { BatchItemCanonical } from "./batchCanonical";
import { BATCH_SCAN_PROMPT } from "./batchPrompt";

export async function analyzeBatchImage(base64: string, mimeType: string) {
  try {
    const cleaned = base64
      .replace(/^data:.*;base64,/, "")
      .replace(/\s/g, "")
      .trim();

    const response = await fetch("https://gemini-proxy.panos-ai.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: cleaned,
        mimeType,
        prompt: BATCH_SCAN_PROMPT,
      }),
    });

    const data = await response.json();
    let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const cleanedJSON = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanedJSON);

    if (!parsed || !Array.isArray(parsed.items)) return [];

    return parsed.items as BatchItemCanonical[];
  } catch (err) {
    console.log("❌ analyzeBatchImage error:", err);
    return [];
  }
}