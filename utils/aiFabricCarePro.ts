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

TASK:
Based ONLY on the fabric name "${fabricName}", return structured care information.

Extract the following fields:

- fabricType: normalized fabric type (translated)
- weave: best guess (translated)
- sensitivity: delicate / normal / durable (translated)
- recommended: {
    temp: number (°C),
    spin: number (rpm),
    program: short wash program name (translated)
}
- careInstructions: array of 3–6 short bullet points (translated)

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

TASK:
The main AI failed. Generate a NEW structured JSON fallback for the fabric "${fabricName}".

Return JSON with the following fields, ALL written in ${userLanguage}:

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

Make sure:
- All values are translated.
- No field is undefined.
- careInstructions has 3–6 bullet points.
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