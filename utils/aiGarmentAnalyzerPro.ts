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
Return ONLY predefined KEYS for every field.
NEVER return natural language text.
NEVER translate anything into Greek or any other language.
The UI will handle translations for 13 languages.

Use ONLY the following allowed keys:

TYPES:
- top, bottom, dress, outerwear, underwear, accessory, unknown

CATEGORIES:
- t_shirt, shirt, jeans, trousers, shorts, skirt, hoodie, sweater, jacket, coat, underwear, socks, other

FABRICS:
- cotton, wool, polyester, nylon, denim, linen, silk, viscose, acrylic, blend, unknown

COLORS:
- white, black, gray, blue, red, green, yellow, brown, beige, pink, multicolor, unknown

PATTERNS:
- solid, striped, checked, dotted, graphic, textured, unknown

STAINS:
- wine, oil_grease, sauce_tomato, coffee_tea, blood, ink_marker,
  sweat_yellowing, dirt_mud, makeup_foundation, chocolate, grass, none

RECOMMENDED PROGRAM:
program:
- cotton_colors, cotton_intensive, synthetics, synthetics_color,
  dark_care, dark_synthetic, wool_hand, delicates

temp:
- temp_20, temp_30, temp_40, temp_60

spin:
- spin_400, spin_600, spin_800, spin_1000

detergent:
- liquid, powder, delicate, wool, color_safe

notes:
- use_fabric_shaver
- wash_inside_out
- heavy_pilling
- color_fade_risk
- shrink_risk
- none

CARE:
wash:
- machineCold, machineWarm, machineHot, handWash, doNotWash

bleach:
- noBleach, nonChlorine

dry:
- tumbleLow, noTumble, lineDry, flatDry

iron:
- noIron, low, medium, high

dryclean:
- noDryclean, drycleanOnly

warnings:
- wash_with_similar_colors
- turn_inside_out
- avoid_high_heat
- may_shrink
- delicate_item
- color_bleeding_risk

RISKS:
- low, medium, high

WASH FREQUENCY:
- after1wear, after2to3wears, afterHeavyUse

CARE SYMBOLS:
- wash_30, no_bleach, tumble_low, iron_low, no_dryclean

Return JSON in this exact structure:

{
  "name": "t_shirt | jeans | hoodie | ...",
  "type": "top | bottom | ...",
  "category": "t_shirt | jeans | ...",
  "fabric": "cotton | wool | ...",
  "color": "white | black | ...",
  "pattern": "solid | striped | ...",
  "stains": ["wine", "dirt_mud", ...],

  "recommended": {
    "program": "cotton_colors | delicates | ...",
    "temp": "temp_30 | temp_40 | ...",
    "spin": "spin_800 | spin_1000 | ...",
    "detergent": "liquid | delicate | ...",
    "notes": ["use_fabric_shaver", "wash_inside_out"]
  },

  "care": {
    "wash": "machineCold | handWash | ...",
    "bleach": "noBleach | nonChlorine",
    "dry": "tumbleLow | noTumble | lineDry | flatDry",
    "iron": "noIron | low | medium | high",
    "dryclean": "noDryclean | drycleanOnly",
    "warnings": ["wash_with_similar_colors", "avoid_high_heat"]
  },

  "risks": {
    "shrinkage": "low | medium | high",
    "colorBleeding": "low | medium | high",
    "delicacy": "low | medium | high"
  },

  "washFrequency": "after1wear | after2to3wears | afterHeavyUse",

  "careSymbols": [
    "wash_30",
    "no_bleach",
    "tumble_low",
    "iron_low",
    "no_dryclean"
  ]
}

Return ONLY the JSON object.
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