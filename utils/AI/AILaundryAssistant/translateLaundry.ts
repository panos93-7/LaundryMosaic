// utils/AI/AILaundryAssistant/translateLaundry.ts
import { LaundryCanonical } from "./aiLaundryCanonical";

const WORKER_URL = "https://gemini-proxy.panos-ai.workers.dev";

export async function translateLaundry(
  canonical: LaundryCanonical,
  targetLocale: string
): Promise<LaundryCanonical> {
  const userLanguage = (targetLocale || "en").toLowerCase();

  // If EN, just return canonical
  if (userLanguage === "en") {
    return canonical;
  }

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `
You are a professional translator specialized in laundry and textile care.

USER_LANGUAGE: ${userLanguage}

LANGUAGE RULES:
- Translate ALL text fields into "${userLanguage}".
- Keep ALL numeric values EXACTLY the same.
- Do NOT add or remove fields.
- Do NOT change the JSON structure.
- Do NOT add explanations or comments.

INPUT (canonical EN JSON):
${JSON.stringify(canonical, null, 2)}

TASK:
Translate ONLY the text values (strings) into "${userLanguage}".
Keep the same JSON structure and numeric values.

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
        `,
      }),
    });

    if (!response.ok) {
      console.log("❌ translateLaundry worker error:", await response.text());
      return canonical;
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
      console.log("❌ translateLaundry JSON parse error:", cleanedJson);
      return canonical;
    }

    // Light normalization: fall back to canonical if something is missing
    return {
      fabricType: parsed?.fabricType || canonical.fabricType,
      weave: parsed?.weave || canonical.weave,
      sensitivity: parsed?.sensitivity || canonical.sensitivity,
      recommended: {
        temp:
          Number.isFinite(parsed?.recommended?.temp) &&
          parsed.recommended.temp !== null
            ? Number(parsed.recommended.temp)
            : canonical.recommended.temp,
        spin:
          Number.isFinite(parsed?.recommended?.spin) &&
          parsed.recommended.spin !== null
            ? Number(parsed.recommended.spin)
            : canonical.recommended.spin,
        program:
          typeof parsed?.recommended?.program === "string" &&
          parsed.recommended.program.trim()
            ? parsed.recommended.program
            : canonical.recommended.program,
      },
      careInstructions:
        Array.isArray(parsed?.careInstructions) &&
        parsed.careInstructions.length > 0
          ? parsed.careInstructions.map((x: any) => String(x || "").trim()).filter(Boolean)
          : canonical.careInstructions,
    };
  } catch (err) {
    console.log("❌ translateLaundry fatal error:", err);
    return canonical;
  }
}