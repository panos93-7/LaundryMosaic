import { preprocessImage } from "../Core/preprocessImage";

export async function analyzeImageCanonical(
  base64: string,
  options: { signal?: AbortSignal } = {}
) {
  const { signal } = options;

  try {
    // Clean base64
    const cleaned = base64.replace(/^data:.*;base64,/, "").trim();

    // Preprocess image (resize, compress, mime detection)
    const { base64: processedBase64, mimeType } = await preprocessImage(
      `data:image/jpeg;base64,${cleaned}`
    );

    // Call Gemini Worker
    const response = await fetch(
      "https://gemini-proxy.panos-ai.workers.dev",
      {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: processedBase64,
          mimeType,
          prompt: buildPrompt(),
        }),
      }
    );

    if (!response.ok) {
      console.log("❌ analyzeImageCanonical worker error:", await response.text());
      return null;
    }

    const data = await response.json();
    let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!raw || typeof raw !== "string") {
      console.log("❌ Empty or invalid raw response");
      return null;
    }

    raw = raw.trim();

    // ------------------------------------------------------------------
    // ⭐ FIX: Extract ONLY the JSON, even if Gemini adds text around it
    // ------------------------------------------------------------------
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) {
      console.log("❌ No JSON found in response:", raw);
      return null;
    }

    const jsonString = raw.slice(firstBrace, lastBrace + 1);

    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (err) {
      console.log("❌ JSON parse error:", jsonString);
      return null;
    }

    return normalizeCanonical(parsed);
  } catch (err: any) {
    if (err?.name === "AbortError") {
      console.log("⛔ analyzeImageCanonical aborted");
      return null;
    }

    console.log("❌ analyzeImageCanonical fatal error:", err);
    return null;
  }
}

function buildPrompt() {
  return `
You are a deterministic garment-analysis engine.

Return ONLY valid JSON. No markdown. No prose. No explanations.
Never wrap the JSON in backticks. Never include comments.

JSON schema:
{
  "name": string,
  "type": string,
  "category": string,
  "fabric": string,
  "color": string,
  "pattern": string,
  "stains": string[],
  "recommended": {
    "program": string,
    "temp": number,
    "spin": number
  },
  "care": {
    "wash": string,
    "bleach": string,
    "dry": string,
    "iron": string,
    "dryclean": string,
    "warnings": string[]
  },
  "risks": {
    "shrinkage": string,
    "colorBleeding": string,
    "delicacy": string
  },
  "washFrequency": string,
  "careSymbols": string[]
}

Rules:
- "stains" MUST ALWAYS be an array of strings.
- NEVER return objects inside "stains".
- NEVER return null in any field.
- No extra fields.
- No text outside JSON.
`.trim();
}

function normalizeCanonical(obj: any) {
  const safeString = (v: any) =>
    typeof v === "string" && v.trim() ? v.trim() : "";

  const safeArray = (arr: any) =>
    Array.isArray(arr)
      ? arr
          .filter((x: any) => typeof x === "string")
          .map((x: string) => x.trim())
      : [];

  return {
    name: safeString(obj.name),
    type: safeString(obj.type),
    category: safeString(obj.category),
    fabric: safeString(obj.fabric),
    color: safeString(obj.color),
    pattern: safeString(obj.pattern),

    stains: safeArray(obj.stains),

    recommended: {
      program: safeString(obj?.recommended?.program),
      temp:
        typeof obj?.recommended?.temp === "number"
          ? obj.recommended.temp
          : 30,
      spin:
        typeof obj?.recommended?.spin === "number"
          ? obj.recommended.spin
          : 800,
    },

    care: {
      wash: safeString(obj?.care?.wash),
      bleach: safeString(obj?.care?.bleach),
      dry: safeString(obj?.care?.dry),
      iron: safeString(obj?.care?.iron),
      dryclean: safeString(obj?.care?.dryclean),
      warnings: safeArray(obj?.care?.warnings),
    },

    risks: {
      shrinkage: safeString(obj?.risks?.shrinkage),
      colorBleeding: safeString(obj?.risks?.colorBleeding),
      delicacy: safeString(obj?.risks?.delicacy),
    },

    washFrequency: safeString(obj.washFrequency),
    careSymbols: safeArray(obj.careSymbols),
  };
}