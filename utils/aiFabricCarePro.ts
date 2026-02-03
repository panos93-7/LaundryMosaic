import i18n from "../i18n";

/**
 * PRO Fabric Care Generator (via Cloudflare Worker)
 * Fully multilingual — including fallback.
 */

export async function generateCareInstructionsPro(fabricName: string) {
  const userLanguage = (i18n as any).language;

  try {
    const response = await fetch(
      "https://gemini-proxy.panos-ai.workers.dev",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `
You are a textile and laundry expert.

LANGUAGE RULES:
- Always answer ONLY in the following language: "${userLanguage}".
- Translate ALL fields into ${userLanguage}.
- Never answer in English unless userLanguage is "en".

STRUCTURE RULES (CRITICAL):
- You MUST return ALL fields exactly as shown.
- You MUST NOT remove, rename, or omit ANY field.
- You MUST NOT return undefined or null.
- If you do not know a value, use a reasonable default.
- recommended.temp MUST be a number.
- recommended.spin MUST be a number.
- recommended.program MUST be a short program name in ${userLanguage}.
- careInstructions MUST be an array of 3–6 bullet points.

TASK:
Based ONLY on the fabric name "${fabricName}", return structured care information.

Return ONLY valid JSON in this exact format:

{
  "fabricType": "...",
  "weave": "...",
  "sensitivity": "...",
  "recommended": {
    "temp": 30,
    "spin": 800,
    "program": "..."
  },
  "careInstructions": ["...", "..."]
}
`
        }),
      }
    );

    if (!response.ok) {
      return await multilingualFallback(fabricName, userLanguage);
    }

    const data = await response.json();

    let rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const cleanedJson = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(cleanedJson);
    } catch {
      return await multilingualFallback(fabricName, userLanguage);
    }

    return parsed;

  } catch {
    return await multilingualFallback(fabricName, userLanguage);
  }
}

/* ----------------------------- */
/* MULTILINGUAL FALLBACK */
/* ----------------------------- */

async function multilingualFallback(fabricName: string, userLanguage: string) {
  try {
    const response = await fetch(
      "https://gemini-proxy.panos-ai.workers.dev",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `
You are a textile and laundry expert.

LANGUAGE RULES:
- Always answer ONLY in the following language: "${userLanguage}".
- Never answer in English unless userLanguage is "en".

STRUCTURE RULES (CRITICAL):
- You MUST return ALL fields exactly as shown.
- You MUST NOT remove, rename, or omit ANY field.
- You MUST NOT return undefined or null.
- If you do not know a value, use a reasonable default.
- recommended.temp MUST be a number.
- recommended.spin MUST be a number.
- recommended.program MUST be a short program name in ${userLanguage}.
- careInstructions MUST be an array of 3–6 bullet points.

TASK:
The main AI failed. Generate a NEW structured JSON fallback for the fabric "${fabricName}".

Return ONLY valid JSON in this exact format:

{
  "fabricType": "...",
  "weave": "...",
  "sensitivity": "...",
  "recommended": {
    "temp": 30,
    "spin": 800,
    "program": "..."
  },
  "careInstructions": ["...", "..."]
}
`
        }),
      }
    );

    const data = await response.json();

    let rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const cleanedJson = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleanedJson);

  } catch {
    // last resort fallback (English)
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
        "Air dry",
      ],
    };
  }
}