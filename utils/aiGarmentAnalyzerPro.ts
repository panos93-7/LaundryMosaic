import { preprocessImage } from "./AI/preprocessImage";

export async function analyzeGarmentPro(base64: string) {
  try {
    // Clean base64 prefix
    const cleaned = base64.replace(/^data:.*;base64,/, "").trim();

    // Preprocess image (resize, compress, JPEG)
    const { base64: processedBase64, mimeType } = await preprocessImage(
      `data:image/jpeg;base64,${cleaned}`
    );

    // Call Cloudflare Worker
    const response = await fetch(
      "https://gemini-proxy.panos-ai.workers.dev",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: processedBase64,
          mimeType,
          prompt: `
You are an expert fashion, textile, and laundry-care assistant.
Analyze the garment in the image and return ONLY valid JSON.
Do NOT include explanations, markdown, or extra text.

IMPORTANT:
- All responses must be in clear, natural English.
- Use natural language for all fields (not keys).
- Do NOT translate anything into Greek or any other language.
- The UI will handle translations into other languages.

Extract a complete garment profile with the following structure:

{
  "name": "...",
  "type": "...",
  "category": "...",
  "fabric": "...",
  "color": "...",
  "pattern": "...",
  "stains": ["..."],

  "recommended": {
    "program": "...",
    "temp": 30,
    "spin": 800,
    "detergent": "liquid | powder | delicate | wool | color-safe",
    "notes": ["...", "..."]
  },

  "care": {
    "wash": "Machine wash cold (30°C) | Hand wash | Do not wash",
    "bleach": "Do not bleach | Non-chlorine bleach only",
    "dry": "Tumble dry low | Do not tumble dry | Line dry | Dry flat",
    "iron": "Do not iron | Iron low | Iron medium | Iron high",
    "dryclean": "Do not dry clean | Dry clean only",
    "warnings": [
      "May shrink",
      "Wash with similar colors",
      "Turn inside out",
      "Avoid high heat"
    ]
  },

  "risks": {
    "shrinkage": "Low | Medium | High",
    "colorBleeding": "Low | Medium | High",
    "delicacy": "Low | Medium | High"
  },

  "washFrequency": "after 1 wear | after 2–3 wears | after heavy use",

  "careSymbols": [
    "Wash 30",
    "No bleach",
    "Tumble low",
    "Iron low",
    "No dryclean"
  ]
}

Rules:
- All fields must be filled.
- Use short, clear English phrases.
- If uncertain, make the best reasonable guess based on the garment.
- Return ONLY the JSON object.
`
        }),
      }
    );

    if (!response.ok) {
      console.log("❌ Worker error:", await response.text());
      return null;
    }

    const data = await response.json();

    // -----------------------------
    //  BULLETPROOF JSON EXTRACTION
    // -----------------------------
    let rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const cleanedJson = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(cleanedJson);
    } catch (e) {
      console.log("❌ Failed to parse JSON:", cleanedJson);
      return null;
    }

    return parsed;

  } catch (err) {
    console.log("❌ PRO analyzer error:", err);
    return null;
  }
}