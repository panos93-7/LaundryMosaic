import i18n from "../i18n";
const locale = i18n.locale;

export async function analyzeGarmentPro(base64: string) {
  try {
    const cleaned = base64.replace(/^data:.*;base64,/, "").trim();
    const processedBase64 = cleaned;
    const mimeType = "image/jpeg";

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

LANGUAGE RULES:
- Respond ONLY in ${locale}.
- Translate ALL fields into ${locale}.
- Do NOT use English words unless absolutely unavoidable.
- Keep translations natural, short, and consistent.
- Do NOT translate JSON keys, only values.

OUTPUT RULES:
- Return ONLY the JSON object.
- No commentary, no markdown, no code fences.
- All fields must be filled with short, clear phrases.
- If uncertain, make the best reasonable guess.

SCHEMA:
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
    "detergent": "...",
    "notes": ["...", "..."]
  },

  "care": {
    "wash": "...",
    "bleach": "...",
    "dry": "...",
    "iron": "...",
    "dryclean": "...",
    "warnings": ["...", "..."]
  },

  "risks": {
    "shrinkage": "...",
    "colorBleeding": "...",
    "delicacy": "..."
  },

  "washFrequency": "...",

  "careSymbols": ["...", "..."]
}

IMPORTANT:
- JSON keys must remain in English.
- JSON values must be translated into ${locale}.
- Do NOT invent new fields.
- Do NOT remove fields.
- Do NOT wrap the JSON in backticks.
`,
        }),
      }
    );

    if (!response.ok) {
      console.log("❌ Worker error:", await response.text());
      throw new Error("Worker returned non-OK response");
    }

    const data = await response.json();

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const rawText = parts.map((p: any) => p?.text || "").join("\n").trim();

    const cleanedJson = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    if (!cleanedJson || cleanedJson.length < 5) {
      console.log("❌ Empty or invalid JSON from model:", cleanedJson);
      throw new Error("Invalid AI JSON");
    }

    let parsed: any;

    try {
      parsed = JSON.parse(cleanedJson);
    } catch (e) {
      console.log("❌ Failed to parse JSON:", cleanedJson);
      throw new Error("JSON parse error");
    }

    return {
      name: parsed.name ?? "",
      type: parsed.type ?? "",
      category: parsed.category ?? "",
      fabric: parsed.fabric ?? "",
      color: parsed.color ?? "",
      pattern: parsed.pattern ?? "",

      stains: Array.isArray(parsed.stains)
        ? parsed.stains.filter((s: any) => typeof s === "string")
        : [],

      recommended: {
        program: parsed?.recommended?.program ?? "",
        temp:
          typeof parsed?.recommended?.temp === "number"
            ? parsed.recommended.temp
            : 30,
        spin:
          typeof parsed?.recommended?.spin === "number"
            ? parsed.recommended.spin
            : 800,
        detergent: parsed?.recommended?.detergent ?? "",
        notes: Array.isArray(parsed?.recommended?.notes)
          ? parsed.recommended.notes.filter((n: any) => typeof n === "string")
          : [],
      },

      care: {
        wash: parsed?.care?.wash ?? "",
        bleach: parsed?.care?.bleach ?? "",
        dry: parsed?.care?.dry ?? "",
        iron: parsed?.care?.iron ?? "",
        dryclean: parsed?.care?.dryclean ?? "",
        warnings: Array.isArray(parsed?.care?.warnings)
          ? parsed.care.warnings.filter((w: any) => typeof w === "string")
          : [],
      },

      risks: {
        shrinkage: parsed?.risks?.shrinkage ?? "",
        colorBleeding: parsed?.risks?.colorBleeding ?? "",
        delicacy: parsed?.risks?.delicacy ?? "",
      },

      washFrequency: parsed.washFrequency ?? "",

      careSymbols: Array.isArray(parsed.careSymbols)
        ? parsed.careSymbols.filter((c: any) => typeof c === "string")
        : [],

      // ΠΑΝΤΑ παρόν, έστω κενό
      stainTips: Array.isArray(parsed.stainTips)
  ? parsed.stainTips.filter((s: any) => typeof s === "string")
  : [],
    };
  } catch (err) {
    console.log("❌ PRO analyzer error:", err);
    throw err;
  }
}