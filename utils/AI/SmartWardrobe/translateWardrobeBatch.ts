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
Translate ONLY the natural-language sentences in this JSON object into ${locale}.
DO NOT translate enums.
DO NOT translate careSymbols.
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