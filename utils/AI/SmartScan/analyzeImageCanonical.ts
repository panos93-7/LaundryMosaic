import { preprocessImage } from "../Core/preprocessImage";

export async function analyzeImageCanonical(base64: string) {
  try {
    const cleaned = base64.replace(/^data:.*;base64,/, "").trim();

    const { base64: processedBase64, mimeType } = await preprocessImage(
      `data:image/jpeg;base64,${cleaned}`
    );

    const response = await fetch("https://gemini-proxy.panos-ai.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: processedBase64,
        mimeType,
        prompt: `
You are an expert laundry assistant.
Analyze the garment and return ONLY valid JSON in ENGLISH.

IMPORTANT RULES:
- "stains" MUST ALWAYS be an array of strings.
- NEVER return objects inside "stains".
- NEVER return null in any field.
- Follow the schema EXACTLY.

Schema:
{
  "name": "",
  "type": "",
  "category": "",
  "fabric": "",
  "color": "",
  "pattern": "",
  "stains": ["string"],  // ALWAYS an array of strings
  "recommended": { "program": "", "temp": 30, "spin": 800 },
  "care": {
    "wash": "",
    "bleach": "",
    "dry": "",
    "iron": "",
    "dryclean": "",
    "warnings": []
  },
  "risks": {
    "shrinkage": "",
    "colorBleeding": "",
    "delicacy": ""
  },
  "washFrequency": "",
  "careSymbols": []
}
        `
      })
    });

    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleanedJson = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    return JSON.parse(cleanedJson);
  } catch (err) {
    console.log("❌ analyzeImageCanonical error:", err);
    return null;
  }
}