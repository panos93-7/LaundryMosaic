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
    "detergent": "Liquid | Powder | Delicate | Wool | Color-safe",
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

  "washFrequency": "After 1 wear | After 2–3 wears | After heavy use",

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
      stainTips: [],
    };
  } catch (err) {
    console.log("❌ PRO analyzer error:", err);
    throw err;
  }
}