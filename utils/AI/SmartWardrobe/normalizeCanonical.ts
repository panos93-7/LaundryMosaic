import { WardrobeCanonical } from "./wardrobeCanonical";

export function normalizeCanonical(raw: any): WardrobeCanonical {
  const norm = (v?: string) =>
    (v ?? "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");

  const mapColor = (color: string) => {
    const c = norm(color);
    if (c.includes("light blue") || c.includes("sky")) return "light_blue";
    if (c.includes("light gray") || c.includes("grey")) return "light_gray";
    if (c.includes("blue")) return "blue";
    if (c.includes("gray") || c.includes("grey")) return "gray";
    return c || "unknown";
  };

  const mapFabric = (fabric: string) => {
    const f = norm(fabric);
    if (f.includes("cotton") && f.includes("poly")) return "cotton_poly_blend";
    if (f.includes("cotton blend")) return "cotton_blend";
    if (f.includes("cotton")) return "cotton";
    return f || "unknown";
  };

  const mapProgram = (program: string) => {
    const p = norm(program);
    if (p.includes("synthetic")) return "synthetics";
    if (p.includes("cotton")) return "cotton";
    if (p.includes("delicate")) return "delicates";
    return p || "unknown";
  };

  const mapCareSymbol = (symbol: string) => {
    const s = norm(symbol);
    if (s.includes("washat30") || s.includes("30")) return "WashAt30";
    if (s.includes("bleach")) return "DoNotBleach";
    if (s.includes("tumble") && s.includes("low")) return "TumbleDryLow";
    if (s.includes("iron") && s.includes("low")) return "IronLow";
    if (s.includes("iron") && s.includes("medium")) return "IronMedium";
    if (s.includes("dryclean")) return "DoNotDryClean";
    return symbol;
  };

  return {
    name: norm(raw.name),
    type: norm(raw.type),
    category: norm(raw.category),
    fabric: mapFabric(raw.fabric),
    color: mapColor(raw.color),
    pattern: norm(raw.pattern),

    stains: raw.stains ?? [],
    stainTips: raw.stainTips ?? [],

    recommended: {
      program: mapProgram(raw.recommended?.program),
      temp: raw.recommended?.temp ?? 30,
      spin: raw.recommended?.spin ?? 800,
      detergent: norm(raw.recommended?.detergent),
      notes: raw.recommended?.notes ?? [],
    },

    care: {
      wash: raw.care?.wash ?? "",
      bleach: raw.care?.bleach ?? "",
      dry: raw.care?.dry ?? "",
      iron: raw.care?.iron ?? "",
      dryclean: raw.care?.dryclean ?? "",
      warnings: raw.care?.warnings ?? [],
    },

    careSymbols: (raw.careSymbols ?? [])
      .map(mapCareSymbol)
      .sort(),

    risks: {
      shrinkage: norm(raw.risks?.shrinkage),
      colorBleeding: norm(raw.risks?.colorBleeding),
      delicacy: norm(raw.risks?.delicacy),
    },

    washFrequency: norm(raw.washFrequency),

    __locale: "en",
  };
}