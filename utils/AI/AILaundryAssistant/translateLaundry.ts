// utils/AI/AILaundryAssistant/translateLaundry.ts
import { LaundryCanonical } from "./aiLaundryCanonical";

const WORKER_URL = "https://gemini-proxy.panos-ai.workers.dev";

/* ---------------------------------------------------------
   Locale → Language Name Mapping (aligned with SmartWardrobe)
--------------------------------------------------------- */
const LANGUAGE_MAP: Record<string, string> = {
  en: "English",
  el: "Greek",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  tr: "Turkish",
  ru: "Russian",
  ja: "Japanese",
  ko: "Korean",
  "zh-tw": "Traditional Chinese",
  "pt-pt": "Portuguese (Portugal)",
  "pt-br": "Portuguese (Brazil)",
};

function resolveLanguageName(locale: string): string {
  const key = locale.toLowerCase();
  return LANGUAGE_MAP[key] || "English";
}

/* ---------------------------------------------------------
   MAIN TRANSLATION FUNCTION (WITH LOGS)
--------------------------------------------------------- */
export async function translateLaundry(
  canonical: LaundryCanonical,
  targetLocale: string
): Promise<LaundryCanonical> {
  const normalized = (targetLocale || "en").toLowerCase();
  const languageName = resolveLanguageName(normalized);

  console.log("🌍 translateLaundry → targetLocale:", targetLocale);
  console.log("🌍 translateLaundry → normalized:", normalized);
  console.log("🌍 translateLaundry → languageName:", languageName);

  // If EN → no translation needed
  if (normalized === "en") {
    console.log("ℹ️ translateLaundry → locale is EN, skipping translation.");
    return canonical;
  }

  const prompt = `
You are a professional translator specialized in laundry and textile care.

TARGET_LANGUAGE: ${languageName}

ANSWER ONLY IN ${languageName}.
TRANSLATE ALL TEXT STRICTLY INTO ${languageName}.

LANGUAGE RULES:
- Translate ALL text fields into ${languageName}.
- Keep ALL numeric values EXACTLY the same.
- Do NOT add or remove fields.
- Do NOT change the JSON structure.
- Do NOT add explanations or comments.

INPUT (canonical EN JSON):
${JSON.stringify(canonical, null, 2)}

TASK:
Translate ONLY the text values (strings) into ${languageName}.
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
`;

  console.log("📤 translateLaundry → PROMPT SENT TO WORKER:\n", prompt);

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.log("❌ translateLaundry worker error:", errText);
      return canonical;
    }

    const data = await response.json();
    console.log("📥 translateLaundry → RAW WORKER RESPONSE:\n", JSON.stringify(data, null, 2));

    let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("📥 translateLaundry → rawText:", rawText);

    const cleanedJson = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    console.log("🧹 translateLaundry → cleanedJson:", cleanedJson);

    let parsed: any;
    try {
      parsed = JSON.parse(cleanedJson);
      console.log("📦 translateLaundry → parsed JSON:", parsed);
    } catch (err) {
      console.log("❌ translateLaundry JSON parse error:", cleanedJson);
      return canonical;
    }

    // Light normalization: fall back to canonical if something is missing
    const finalResult = {
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
          ? parsed.careInstructions
              .map((x: any) => String(x || "").trim())
              .filter(Boolean)
          : canonical.careInstructions,
    };

    console.log("✅ translateLaundry → FINAL RESULT:", finalResult);

    return finalResult;
  } catch (err) {
    console.log("❌ translateLaundry fatal error:", err);
    return canonical;
  }
}