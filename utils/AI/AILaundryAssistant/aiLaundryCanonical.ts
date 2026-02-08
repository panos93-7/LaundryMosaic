// utils/AI/AILaundryAssistant/aiLaundryCanonical.ts
export type LaundryCanonical = {
  fabricType: string;
  weave: string;
  sensitivity: string;
  recommended: {
    temp: number;
    spin: number;
    program: string;
  };
  careInstructions: string[];
};

const WORKER_URL = "https://gemini-proxy.panos-ai.workers.dev";

function normalizeCanonical(raw: any): LaundryCanonical {
  const fabricType = String(raw?.fabricType || "Unknown");
  const weave = String(raw?.weave || "Unknown");
  const sensitivity = String(raw?.sensitivity || "Normal");

  const temp = Number.isFinite(raw?.recommended?.temp)
    ? Number(raw.recommended.temp)
    : 30;

  const spin = Number.isFinite(raw?.recommended?.spin)
    ? Number(raw.recommended.spin)
    : 800;

  const program =
    typeof raw?.recommended?.program === "string" && raw.recommended.program.trim()
      ? String(raw.recommended.program)
      : "Delicates";

  let careInstructions: string[] = [];

  if (Array.isArray(raw?.careInstructions)) {
    careInstructions = raw.careInstructions
      .map((x: any) => String(x || "").trim())
      .filter(Boolean);
  } else if (typeof raw?.careInstructions === "string") {
    careInstructions = raw.careInstructions
      .split(/\n|•|-|\*/g)
      .map((s: string) => s.trim())
      .filter(Boolean);
  }

  if (careInstructions.length === 0) {
    careInstructions = [
      "Wash at 30°C",
      "Use mild detergent",
      "Avoid high spin",
      "Air dry",
    ];
  }

  return {
    fabricType,
    weave,
    sensitivity,
    recommended: { temp, spin, program },
    careInstructions,
  };
}

function fallbackCanonical(): LaundryCanonical {
  return {
    fabricType: "Unknown",
    weave: "Unknown",
    sensitivity: "Normal",
    recommended: {
      temp: 30,
      spin: 800,
      program: "Delicates",
    },
    careInstructions: [
      "Wash at 30°C",
      "Use mild detergent",
      "Avoid high spin",
      "Air dry",
    ],
  };
}

export async function generateLaundryCanonical(
  userQuery: string
): Promise<LaundryCanonical> {
  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `
You are a textile and laundry expert.

LANGUAGE RULES:
- Always answer ONLY in English.
- Do NOT translate to any other language.

TASK:
The user provided this item or description:
"${userQuery}"

You MUST:
1. Infer the most likely primary fabric/material.
2. Infer the weave type.
3. Infer the sensitivity level (Low, Medium, High).
4. Recommend a safe wash temperature (°C) and spin (rpm).
5. Recommend a short wash program name.
6. Generate 3–6 clear care instructions as bullet points.

Return ONLY valid JSON in this exact format:

{
  "fabricType": "...",
  "weave": "...",
  "sensitivity": "...",
  "recommended": {
    "temp": 30,
    "spin": 800,
    "program": "Delicates"
  },
  "careInstructions": ["...", "..."]
}
        `,
      }),
    });

    if (!response.ok) {
      console.log("❌ generateLaundryCanonical worker error:", await response.text());
      return fallbackCanonical();
    }

    const data = await response.json();
    let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const cleanedJson = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleanedJson);
    } catch (err) {
      console.log("❌ generateLaundryCanonical JSON parse error:", cleanedJson);
      return fallbackCanonical();
    }

    return normalizeCanonical(parsed);
  } catch (err) {
    console.log("❌ generateLaundryCanonical fatal error:", err);
    return fallbackCanonical();
  }
}