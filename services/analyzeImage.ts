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

    const cleanedBase64 = base64
      .replace(/^data:.*;base64,/, "")
      .replace(/\s/g, "")
      .trim();

    if (cleanedBase64.length < 50) {
      console.log("❌ Base64 too small or corrupted");
      return null;
    }

    const finalMime =
      mimeType ||
      (cleanedBase64.startsWith("/9j/") ? "image/jpeg" : "image/png");

    const response = await fetch(
      "https://gemini-proxy.panos-ai.workers.dev",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: cleanedBase64,
          mimeType: finalMime,
          prompt: `
You are an expert laundry assistant.

Analyze ALL garments visible in the image and return ONLY valid JSON.

For each garment, detect:

- fabric type (cotton, synthetics, wool, delicate)
- color (white, colored, dark)
- stains: detect ANY visible stains such as:
  - wine
  - oil / grease
  - sauce / tomato
  - coffee / tea
  - blood
  - ink / marker
  - sweat / yellowing
  - dirt / mud
  - makeup / foundation
  - chocolate
  - grass
If no stains are visible, return an empty array.

Return JSON in this exact format:

{
  "items": [
    {
      "fabric": "cotton | synthetics | wool | delicate",
      "color": "white | colored | dark",
      "stains": ["wine", "oil"],
      "recommended": {
        "temp": 40,
        "spin": 1000,
        "program": "Cotton Colors"
      }
    }
  ]
}

Rules:
- Detect ALL garments in the image (not just one).
- Stain names must be lowercase.
- If uncertain, make the best guess.
- Do NOT include any text outside the JSON.
`
        }),
      }
    );

    if (!response.ok) {
      console.log("❌ Worker error:", await response.text());
      return null;
    }

    const data = await response.json();

    let rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!rawText) {
      console.log("❌ No text returned from Gemini");
      return null;
    }

    const cleaned = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .replace(/[\u0000-\u001F]+/g, "")
      .trim();

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

    let items: any[] = [];

    if (Array.isArray(parsed.items)) {
      items = parsed.items;
    } else {
      items = [parsed];
    }

    const normalized = items
      .map((item) => {
        if (!item.fabric || !item.color) {
          return null;
        }

        if (!item.recommended) {
          item.recommended = getProgramFor(item.fabric, item.color) || {
            temp: 30,
            spin: 800,
            program: "Quick Wash",
          };
        }

        item.recommended = {
          temp: item.recommended.temp ?? 30,
          spin: item.recommended.spin ?? 800,
          program: item.recommended.program ?? "Quick Wash",
        };

        if (!Array.isArray(item.stains)) {
          item.stains = [];
        }

        item.stains = item.stains.map((s: string) =>
          String(s).toLowerCase().trim()
        );

        return item;
      })
      .filter(Boolean);

    if (normalized.length === 1) {
      return normalized[0];
    }

    return { items: normalized };

  } catch (err) {
    console.log("❌ analyzeImageWithGemini error:", err);
    return null;
  }
}