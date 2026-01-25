import { preprocessImage } from "./AI/preprocessImage";

export async function analyzeFabricPro(base64: string) {
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
You are a textile and laundry expert. Analyze the fabric in the image and return ONLY valid JSON.

Extract the following fields:

- fabricType
- weave
- sensitivity
- recommended: { temp, spin, program }
- careInstructions: array of bullet points

Return JSON in this exact format:

{
  "fabricType": "...",
  "weave": "...",
  "sensitivity": "...",
  "recommended": {
    "temp": 30,
    "spin": 800,
    "program": "Delicates"
  },
  "careInstructions": ["...", "..."]
}
`
        }),
      }
    );

    if (!response.ok) {
      console.log("❌ Worker error:", await response.text());
      return fallbackFabricPro();
    }

    const parsed = await response.json();

    // Validate + normalize
    return {
      fabricType: parsed.fabricType ?? "Unknown",
      weave: parsed.weave ?? "Unknown",
      sensitivity: parsed.sensitivity ?? "Normal",
      recommended: {
        temp: parsed.recommended?.temp ?? 30,
        spin: parsed.recommended?.spin ?? 800,
        program: parsed.recommended?.program ?? "Quick Wash",
      },
      careInstructions: Array.isArray(parsed.careInstructions)
        ? parsed.careInstructions
        : ["Wash at 30°C", "Use mild detergent", "Avoid high spin"],
    };
  } catch (err) {
    console.log("❌ analyzeFabricPro error:", err);
    return fallbackFabricPro();
  }
}

function fallbackFabricPro() {
  return {
    fabricType: "Unknown",
    weave: "Unknown",
    sensitivity: "Normal",
    recommended: {
      temp: 30,
      spin: 800,
      program: "Quick Wash",
    },
    careInstructions: [
      "Wash at 30°C",
      "Use mild detergent",
      "Avoid high spin",
    ],
  };
}