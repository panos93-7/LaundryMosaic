import i18n from "../i18n";

/**
 * PRO Fabric Care Generator (via Cloudflare Worker)
 * Now fully multilingual — including fallback.
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
      console.log("❌ Worker error:", await response.text());
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
    } catch (e) {
      console.log("❌ Failed to parse JSON:", cleanedJson);
      return await multilingualFallback(fabricName, userLanguage);
    }

    return {
      fabricType: parsed.fabricType ?? normalizeFabric(fabricName),
      weave: parsed.weave ?? "Unknown",
      sensitivity: parsed.sensitivity ?? guessSensitivity(fabricName),
      recommended: {
        temp: parsed.recommended?.temp ?? 30,
        spin: parsed.recommended?.spin ?? 800,
        program: parsed.recommended?.program ?? "Quick Wash",
      },
      careInstructions: Array.isArray(parsed.careInstructions)
        ? parsed.careInstructions
        : defaultCare(fabricName),
    };

  } catch (err) {
    console.log("❌ generateCareInstructionsPro error:", err);
    return await multilingualFallback(fabricName, userLanguage);
  }
}

/* ----------------------------- */
/* HELPERS */
/* ----------------------------- */

function normalizeFabric(name: string) {
  const n = name.toLowerCase();
  if (n.includes("cotton")) return "cotton";
  if (n.includes("wool")) return "wool";
  if (n.includes("linen")) return "linen";
  if (n.includes("silk")) return "silk";
  if (n.includes("denim")) return "denim";
  if (n.includes("poly")) return "polyester";
  if (n.includes("nylon")) return "nylon";
  if (n.includes("viscose")) return "viscose";
  if (n.includes("acrylic")) return "acrylic";
  return "blend";
}

function guessSensitivity(name: string) {
  const n = name.toLowerCase();
  if (n.includes("wool") || n.includes("silk") || n.includes("cashmere"))
    return "delicate";
  if (n.includes("denim") || n.includes("canvas")) return "durable";
  return "normal";
}

function defaultCare(name: string) {
  const sensitivity = guessSensitivity(name);

  if (sensitivity === "delicate") {
    return [
      "Wash cold (20–30°C)",
      "Use wool/silk detergent",
      "Avoid high spin",
      "Air dry flat",
    ];
  }

  if (sensitivity === "durable") {
    return [
      "Wash at 40°C",
      "Normal detergent",
      "Medium spin",
      "Tumble dry low",
    ];
  }

  return [
    "Wash at 30°C",
    "Use mild detergent",
    "Avoid high spin",
    "Air dry",
  ];
}

/* ----------------------------- */
/* MULTILINGUAL FALLBACK */
/* ----------------------------- */

async function multilingualFallback(name: string, userLanguage: string) {
  const fallback = {
    fabricType: normalizeFabric(name),
    weave: "Unknown",
    sensitivity: guessSensitivity(name),
    recommended: {
      temp: 30,
      spin: 800,
      program: "Quick Wash",
    },
    careInstructions: defaultCare(name),
  };

  try {
    const response = await fetch(
      "https://gemini-proxy.panos-ai.workers.dev",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `
Translate the following JSON values into ${userLanguage}.
Do NOT change the structure. Do NOT add or remove fields.
Return ONLY valid JSON.

${JSON.stringify(fallback, null, 2)}
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

  } catch (err) {
    console.log("❌ multilingualFallback error:", err);
    return fallback; // last resort
  }
}