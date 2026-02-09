// utils/SmartWardrobe/translateWardrobeBatch.ts

export interface CareSymbolLabels {
  [code: string]: string;
}

export interface TranslatedBatch {
  name?: string;
  type?: string;
  color?: string;
  careSymbolLabels?: CareSymbolLabels | string[] | null;
  [key: string]: any;
}

export async function translateWardrobeBatch(
  canonical: any,
  locale: string
): Promise<TranslatedBatch> {
  if (!canonical) return canonical;

  const CARE_SYMBOL_LABELS: CareSymbolLabels = {
    WashAt30: "Wash at 30°C",
    WashAt40: "Wash at 40°C",
    WashCold: "Cold wash",
    DoNotWash: "Do not wash",
    DoNotBleach: "Do not bleach",
    TumbleDryLow: "Tumble dry low",
    TumbleDryMedium: "Tumble dry medium",
    DoNotTumbleDry: "Do not tumble dry",
    IronLow: "Iron on low heat",
    IronMedium: "Iron on medium heat",
    IronHigh: "Iron on high heat",
    DoNotIron: "Do not iron",
    DryClean: "Dry clean",
    DoNotDryClean: "Do not dry clean",
  };

  try {
    const res = await fetch("https://gemini-proxy.panos-ai.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        temperature: 0,
        prompt: `
Translate the following JSON object into ${locale}.
Return ONLY valid JSON.
Do NOT add explanations.
Do NOT add comments.
Do NOT add code fences.

IMPORTANT RULES:
- Translate ONLY text values.
- NEVER translate enums.
- "careSymbols" MUST remain enums.
- Add a new field "careSymbolLabels" with translated labels for each enum.
- Use the following English labels for care symbols:

${JSON.stringify(CARE_SYMBOL_LABELS, null, 2)}

JSON:
${JSON.stringify(canonical)}
        `,
      }),
    });

    const data = await res.json();
    let raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // ⭐ HARDENING LAYER
    raw = raw.trim();
    raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1) {
      raw = raw.substring(firstBrace, lastBrace + 1);
    }

    const parsed: TranslatedBatch = JSON.parse(raw);

    if (Array.isArray(parsed.careSymbolLabels)) {
  const labelsArray = parsed.careSymbolLabels as string[];
  const out: CareSymbolLabels = {};

  canonical.careSymbols.forEach((code: string, i: number) => {
    out[code] = labelsArray[i] ?? "";
  });

  parsed.careSymbolLabels = out;
}

    if (
      !parsed.careSymbolLabels ||
      typeof parsed.careSymbolLabels !== "object"
    ) {
      parsed.careSymbolLabels = {};
    }

    return parsed;
  } catch (err) {
    console.log("❌ translateWardrobeBatch error:", err);
    return canonical; // fallback
  }
}