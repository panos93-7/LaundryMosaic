// utils/SmartWardrobe/translateWardrobeBatch.ts

export interface TranslatedBatch {
  [key: string]: any;
}

export async function translateWardrobeBatch(
  canonical: any,
  locale: string
): Promise<TranslatedBatch> {
  if (!canonical) return canonical;

  try {
    const res = await fetch("https://gemini-proxy.panos-ai.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        temperature: 0,
        prompt: `
Translate ALL values in this JSON object into ${locale}.
Translate everything: name, type, category, fabric, color, pattern,
stains, stainTips, recommended fields, care fields, risks, washFrequency.
DO NOT translate careSymbols (these are fixed codes).
DO NOT generate careSymbolLabels.
Return ONLY valid JSON, no comments, no explanations.

JSON:
${JSON.stringify(canonical)}
        `,
      }),
    });

    const data = await res.json();
    let raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // HARDENING
    raw = raw.trim().replace(/```json/gi, "").replace(/```/g, "").trim();

    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first !== -1 && last !== -1) {
      raw = raw.substring(first, last + 1);
    }

    const parsed = JSON.parse(raw);

    // Remove any accidental AI careSymbolLabels
    delete parsed.careSymbolLabels;

    return parsed;
  } catch (err) {
    console.log("❌ translateWardrobeBatch error:", err);
    return {};
  }
}