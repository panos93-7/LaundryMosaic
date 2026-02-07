export async function translateStainTips(raw: any) {
  try {
    if (!raw || typeof raw !== "object") {
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

    if (!raw.care || typeof raw.care !== "object") {
      raw = {
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

    return normalized;

  } catch (err) {
    console.log("translateStainTips failed:", err);

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
}