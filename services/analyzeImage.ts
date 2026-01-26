import { getProgramFor } from "../constants/programMapping";

export async function analyzeImageWithGemini(
  base64: string,
  mimeType?: string
) {
  try {
    if (!base64 || typeof base64 !== "string") {
      console.log("❌ Invalid base64 input");
      return null;
    }

    // ---------------------------------------------
    // CLEAN BASE64
    // ---------------------------------------------
    const cleanedBase64 = base64
      .replace(/^data:.*;base64,/, "")
      .replace(/\s/g, "")
      .trim();

    if (cleanedBase64.length < 50) {
      console.log("❌ Base64 too small or corrupted");
      return null;
    }

    // ---------------------------------------------
    // MIME TYPE DETECTION
    // ---------------------------------------------
    const finalMime =
      mimeType ||
      (cleanedBase64.startsWith("/9j/") ? "image/jpeg" : "image/png");

    // ---------------------------------------------
    // CALL CLOUDFLARE WORKER
    // ---------------------------------------------
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

    // ---------------------------------------------
    // EXTRACT RAW TEXT FROM GEMINI RESPONSE
    // ---------------------------------------------
    let rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!rawText) {
      console.log("❌ No text returned from Gemini");
      return null;
    }

    // ---------------------------------------------
    // CLEAN JSON (remove markdown, noise, etc.)
    // ---------------------------------------------
    const cleaned = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .replace(/[\u0000-\u001F]+/g, "") // remove control chars
      .trim();

    // ---------------------------------------------
    // PARSE JSON SAFELY
    // ---------------------------------------------
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.log("❌ Failed to parse JSON:", cleaned);
      return null;
    }

    if (!parsed || typeof parsed !== "object") {
      console.log("❌ Parsed JSON invalid:", parsed);
      return null;
    }

    // ---------------------------------------------
    // VALIDATE REQUIRED FIELDS
    // ---------------------------------------------
    if (!parsed.fabric || !parsed.color) {
      console.log("❌ Missing fabric or color:", parsed);
      return null;
    }

    // ---------------------------------------------
    // NORMALIZE RECOMMENDED PROGRAM
    // ---------------------------------------------
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

    // ---------------------------------------------
    // NORMALIZE STAINS
    // ---------------------------------------------
    if (!Array.isArray(parsed.stains)) {
      parsed.stains = [];
    }

    parsed.stains = parsed.stains.map((s: string) =>
      String(s).toLowerCase().trim()
    );

    return parsed;

  } catch (err) {
    console.log("❌ analyzeImageWithGemini error:", err);
    return null;
  }
}