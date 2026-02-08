// utils/SmartWardrobe/analyzeWardrobeImage.ts

import { WARDROBE_PROMPT } from "./wardrobePrompt";

export async function analyzeWardrobeImage(base64: string, mimeType: string) {
  try {
    // 1) Καθαρίζουμε το base64 header
    const cleaned = base64.replace(/^data:.*;base64,/, "").trim();

    // 2) Κάνουμε request στο Gemini proxy
    const response = await fetch("https://gemini-proxy.panos-ai.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: cleaned,
        mimeType,
        prompt: WARDROBE_PROMPT, // ΠΑΝΤΑ ENGLISH canonical JSON
      }),
    });

    const data = await response.json();

    // 3) Παίρνουμε το raw text από το Gemini
    const raw =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // 4) Καθαρίζουμε τυχόν markdown
    const cleanedJson = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // 5) Parse JSON safely
    return JSON.parse(cleanedJson);
  } catch (err) {
    console.log("❌ analyzeWardrobeImage error:", err);
    return null;
  }
}