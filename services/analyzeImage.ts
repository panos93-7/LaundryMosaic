import { getProgramFor } from "../constants/programMapping";

export async function analyzeImageWithGemini(
  base64: string,
  mimeType?: string
) {
  try {
    // Clean base64
    const cleanedBase64 = base64.replace(/^data:.*;base64,/, "").trim();

    // Detect mime type if missing
    const finalMime =
      mimeType ||
      (cleanedBase64.startsWith("/9j/") ? "image/jpeg" : "image/png");

    // Call Cloudflare Worker
    const response = await fetch(
      "https://gemini-proxy.panos-ai.workers.dev",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: cleanedBase64,
          mimeType: finalMime,
          prompt: `
You are an expert laundry assistant. Analyze the image and return ONLY valid JSON.

Extract:
- fabric type (cotton, synthetics, wool, delicate)
- color category (white, colored, dark)
- stains (array)
- recommended washing settings:
  - temp (°C)
  - spin (rpm)
  - program (short name)

Return JSON in this exact format:

{
  "fabric": "...",
  "color": "...",
  "stains": ["..."],
  "recommended": {
    "temp": 40,
    "spin": 1000,
    "program": "Cotton Colors"
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

    const data = await response.json();

    // Worker returns Gemini JSON directly
    let parsed = data;

    if (!parsed || !parsed.fabric || !parsed.color) {
      console.log("❌ Incomplete JSON:", parsed);
      return null;
    }

    // Auto-fill recommended program if missing
    if (!parsed.recommended) {
      parsed.recommended = getProgramFor(parsed.fabric, parsed.color) || {
        temp: 30,
        spin: 800,
        program: "Quick Wash",
      };
    }

    parsed.recommended = {
      temp: parsed.recommended.temp ?? 30,
      spin: parsed.recommended.spin ?? 800,
      program: parsed.recommended.program ?? "Quick Wash",
    };

    // Normalize stains
    if (!Array.isArray(parsed.stains)) {
      parsed.stains = [];
    }

    parsed.stains = parsed.stains.map((s: string) =>
      s.toLowerCase().trim()
    );

    return parsed;
  } catch (err) {
    console.log("❌ analyzeImageWithGemini error:", err);
    return null;
  }
}