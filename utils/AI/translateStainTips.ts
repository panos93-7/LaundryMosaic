export async function translateStainTips(
  canonical: any,
  targetLocale: string,
  key?: string // ← κρατάμε το key για συμβατότητα με safeTranslate
) {
  try {
    if (!canonical || typeof canonical !== "object") {
      return emptyResult();
    }

    const care = canonical.care || {};
    const warnings = Array.isArray(care.warnings) ? care.warnings : [];

    const block = [
      care.wash ?? "",
      care.bleach ?? "",
      care.dry ?? "",
      care.iron ?? "",
      care.dryclean ?? "",
      ...warnings
    ]
      .filter(Boolean)
      .join("\n");

    const response = await fetch("https://gemini-proxy.panos-ai.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `
Translate the following EXACTLY into language "${targetLocale}".
Do NOT reorder lines.
Do NOT add anything.
Do NOT remove anything.

Text:
${block}
        `.trim()
      })
    });

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || block;

    const lines = String(text)
      .split("\n")
      .map((s: string) => s.trim())
      .filter(Boolean);

    return {
      care: {
        wash: lines[0] ?? "",
        bleach: lines[1] ?? "",
        dry: lines[2] ?? "",
        iron: lines[3] ?? "",
        dryclean: lines[4] ?? "",
        warnings: lines.slice(5)
      }
    };
  } catch (err) {
    console.log("translateStainTips failed:", err);
    return emptyResult();
  }
}

function emptyResult() {
  return {
    care: {
      wash: "",
      bleach: "",
      dry: "",
      iron: "",
      dryclean: "",
      warnings: []
    }
  };
}