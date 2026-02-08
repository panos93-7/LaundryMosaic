// utils/SmartWardrobe/analyzeWardrobeImage.ts

import { WARDROBE_PROMPT } from "./wardrobePrompt";

export async function analyzeWardrobeImage(base64: string, mimeType: string) {
  try {
    const cleaned = base64.replace(/^data:.*;base64,/, "").trim();

    const response = await fetch("https://gemini-proxy.panos-ai.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: cleaned,
        mimeType,
        prompt: WARDROBE_PROMPT,
      }),
    });

    const data = await response.json();
    const raw =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const cleanedJson = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleanedJson);
  } catch (err) {
    console.log("❌ analyzeWardrobeImage error:", err);
    return null;
  }
}