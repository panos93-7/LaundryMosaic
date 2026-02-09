// utils/SmartWardrobe/analyzeWardrobeImage.ts

import { WARDROBE_PROMPT } from "./wardrobePrompt";

export async function analyzeWardrobeImage(base64: string, mimeType: string) {
  try {
    // 1) Remove base64 header
    const cleaned = base64.replace(/^data:.*;base64,/, "").trim();

    // 2) Request Gemini
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

    // 3) Extract raw text
    let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    console.log("🧠 RAW VISION OUTPUT:", raw);

    // 4) Remove markdown/code fences
    raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

    // 5) Extract the first valid JSON object
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) {
      console.log("❌ analyzeWardrobeImage: No JSON found");
      return null;
    }

    const jsonText = raw.substring(firstBrace, lastBrace + 1);

    // 6) Parse safely
    try {
      return JSON.parse(jsonText);
    } catch (err) {
      console.log("❌ analyzeWardrobeImage: JSON parse error", err);
      console.log("❌ JSON TEXT:", jsonText);
      return null;
    }
  } catch (err) {
    console.log("❌ analyzeWardrobeImage error:", err);
    return null;
  }
}