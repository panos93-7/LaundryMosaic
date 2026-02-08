import { preprocessImage } from "../Core/preprocessImage";

export async function analyzeImageCanonical(
  base64: string,
  options: { signal?: AbortSignal } = {}
) {
  const { signal } = options;

  try {
    const cleaned = base64.replace(/^data:.*;base64,/, "").trim();

    const { base64: processedBase64, mimeType } = await preprocessImage(
      `data:image/jpeg;base64,${cleaned}`
    );

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

    if (!response.ok) return null;

    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!raw.startsWith("{") || !raw.endsWith("}")) return null;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }

    return normalizeCanonical(parsed);
  } catch (err: any) {
    if (err?.name === "AbortError") return null;
    return null;
  }
}

function buildPrompt() {
  return `
You are a deterministic garment-analysis engine.

Return ONLY valid JSON. No markdown. No prose. No explanations.

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
`.trim();
}

function normalizeCanonical(obj: any) {
  const safeString = (v: any) =>
    typeof v === "string" ? v.trim() : "";

  const safeArray = (arr: any) =>
    Array.isArray(arr)
      ? arr.filter((x) => typeof x === "string").map((x) => x.trim())
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
      temp: typeof obj?.recommended?.temp === "number" ? obj.recommended.temp : 30,
      spin: typeof obj?.recommended?.spin === "number" ? obj.recommended.spin : 800,
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