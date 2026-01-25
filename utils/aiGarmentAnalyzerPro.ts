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
You are an expert fashion and laundry assistant. Analyze the garment in the image and return ONLY valid JSON.

Extract the following fields:

- name
- type
- category
- fabric
- color
- pattern
- stains: array
- recommended: { temp, spin, program }

Return ONLY valid JSON in this exact format:

{
  "name": "...",
  "type": "...",
  "category": "...",
  "fabric": "...",
  "color": "...",
  "pattern": "...",
  "stains": ["..."],
  "recommended": {
    "temp": 30,
    "spin": 800,
    "program": "Quick Wash"
  }
}
`
        }),
      }
    );

    if (!response.ok) {
      console.log("❌ Worker error:", await response.text());
      return null;
    }

    const parsed = await response.json();
    return parsed;

  } catch (err) {
    console.log("❌ PRO analyzer error:", err);
    return null;
  }
}