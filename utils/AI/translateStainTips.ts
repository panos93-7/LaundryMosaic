import { generateCareInstructionsPro } from "../../utils/aiFabricCarePro";

export async function translateStainTips(canonical: any, targetLocale: string) {
  try {
    if (!canonical || typeof canonical !== "object") {
      return emptyResult();
    }

    const care = canonical.care || {};
    const warnings = Array.isArray(care.warnings) ? care.warnings : [];

    // 1) Join canonical care instructions σε ένα block
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

    // 2) Prompt για ΜΕΤΑΦΡΑΣΗ ΜΟΝΟ
    const translationPrompt = `
Μετάφρασε ΑΚΡΙΒΩΣ το παρακάτω κείμενο στη γλώσσα: "${targetLocale}".
ΜΗΝ ξαναυπολογίσεις οδηγίες.
ΜΗΝ αλλάξεις σειρά.
ΜΗΝ προσθέσεις τίποτα.
ΜΗΝ αφαιρέσεις τίποτα.
Μόνο μετάφραση.

Κείμενο:
${block}
    `.trim();

    // 3) Κλήση AI ΜΟΝΟ για μετάφραση
    const translated = await generateCareInstructionsPro(
      translationPrompt,
      targetLocale
    );

    const translatedText = translated?.careInstructions || [];

    // 4) Split back σε γραμμές
    const lines = Array.isArray(translatedText)
      ? translatedText
      : String(translatedText)
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);

    return {
      care: {
        wash: lines[0] ?? "",
        bleach: lines[1] ?? "",
        dry: lines[2] ?? "",
        iron: lines[3] ?? "",
        dryclean: lines[4] ?? "",
        warnings: lines.slice(5)
      },
      stainTips: []
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
    },
    stainTips: []
  };
}