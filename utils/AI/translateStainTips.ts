import i18n from "../../i18n";

export async function translateStainTips(raw: any, locale: string, cacheKey: string) {
  try {
    // 1) GUARDS — prevent crashes from corrupted or old cache
    if (!raw || typeof raw !== "object") return raw;

    // If raw is already translated or minimal, return as-is
    if (!raw.care || typeof raw.care !== "object") {
  return {
    care: {
      wash: "",
      bleach: "",
      dry: "",
      iron: "",
      dryclean: "",
      warnings: [],
    },
    stainTips: [],
  };
}
    const care = raw.care;

    // 2) SAFE NORMALIZATION — ensure all fields exist
    const normalized = {
      ...raw,
      care: {
        wash: care.wash ?? "",
        bleach: care.bleach ?? "",
        dry: care.dry ?? "",
        iron: care.iron ?? "",
        dryclean: care.dryclean ?? "",
        warnings: Array.isArray(care.warnings) ? care.warnings : [],
      },
      stainTips: Array.isArray(raw.stainTips) ? raw.stainTips : [],
    };

    // 3) TRANSLATION — only translate strings, never crash
    const translateField = (text: string) => {
      if (!text || typeof text !== "string") return text;
      return i18n.t(text, { locale }) || text;
    };

    const translated = {
      ...normalized,
      care: {
        wash: translateField(normalized.care.wash),
        bleach: translateField(normalized.care.bleach),
        dry: translateField(normalized.care.dry),
        iron: translateField(normalized.care.iron),
        dryclean: translateField(normalized.care.dryclean),
        warnings: normalized.care.warnings.map((w: string) => translateField(w)),
      },
      stainTips: normalized.stainTips.map((tip: string) => translateField(tip)),
    };

    return translated;
  } catch (err) {
    console.log("translateStainTips failed:", err);
    return raw; // fallback to raw to avoid UI crash
  }
}