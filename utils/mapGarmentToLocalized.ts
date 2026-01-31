import i18n from "../i18n";

export interface AIGarment {
  name: string;
  type: string;
  category: string;
  fabric: string;
  color: string;
  pattern: string;
  stains: string[];

  recommended: {
    program: string;
    temp: string;
    spin: string;
    detergent: string;
    notes: string;
  };

  care: {
    wash: string;
    bleach: string;
    dry: string;
    iron: string;
    dryclean: string;
    warnings: string[];
  };

  risks: {
    shrinkage: string;
    colorBleeding: string;
    delicacy: string;
  };

  washFrequency: string;
  careSymbols: string[];
}

export function localizeGarment(ai: AIGarment): AIGarment {
  return {
    ...ai,

    care: {
      wash: i18n.t(`careValues.wash.${mapWash(ai.care.wash)}`),
      bleach: i18n.t(`careValues.bleach.${mapBleach(ai.care.bleach)}`),
      dry: i18n.t(`careValues.dry.${mapDry(ai.care.dry)}`),
      iron: i18n.t(`careValues.iron.${mapIron(ai.care.iron)}`),
      dryclean: i18n.t(`careValues.dryclean.${mapDryclean(ai.care.dryclean)}`),

      warnings:
        ai.care.warnings?.map((w: string) =>
          i18n.t(`careWarnings.${normalizeKey(w)}`, { defaultValue: w })
        ) ?? [],
    },

    risks: {
      shrinkage: i18n.t(`riskValues.${mapRisk(ai.risks.shrinkage)}`),
      colorBleeding: i18n.t(`riskValues.${mapRisk(ai.risks.colorBleeding)}`),
      delicacy: i18n.t(`riskValues.${mapRisk(ai.risks.delicacy)}`),
    },

    washFrequency: i18n.t(`frequency.${mapFrequency(ai.washFrequency)}`),

    careSymbols:
      ai.careSymbols?.map((sym: string) =>
        i18n.t(`careSymbols.${sym}`, { defaultValue: sym })
      ) ?? [],
  };
}

/* -------------------------------------------------- */
/* MAPPING HELPERS                                    */
/* -------------------------------------------------- */

function mapWash(value: string = "") {
  const v = value.toLowerCase();
  if (v.includes("hand")) return "handWash";
  if (v.includes("do not wash")) return "doNotWash";
  if (v.includes("40")) return "machineWarm";
  if (v.includes("60")) return "machineHot";
  return "machineCold";
}

function mapBleach(value: string = "") {
  const v = value.toLowerCase();
  if (v.includes("non-chlorine")) return "nonChlorine";
  return "noBleach";
}

function mapDry(value: string = "") {
  const v = value.toLowerCase();
  if (v.includes("do not tumble")) return "noTumble";
  if (v.includes("line")) return "lineDry";
  if (v.includes("flat")) return "flatDry";
  return "tumbleLow";
}

function mapIron(value: string = "") {
  const v = value.toLowerCase();
  if (v.includes("do not iron")) return "noIron";
  if (v.includes("low")) return "low";
  if (v.includes("medium")) return "medium";
  return "high";
}

function mapDryclean(value: string = "") {
  const v = value.toLowerCase();
  if (v.includes("do not dry clean")) return "noDryclean";
  return "drycleanOnly";
}

function mapFrequency(value: string = "") {
  const v = value.toLowerCase();
  if (v.includes("1")) return "after1wear";
  if (v.includes("2") || v.includes("3")) return "after2to3wears";
  return "afterHeavyUse";
}

function mapRisk(value: string = "") {
  const v = value.toLowerCase();

  if (v.includes("low")) return "low";
  if (v.includes("medium") || v.includes("moderate")) return "medium";
  if (v.includes("high")) return "high";

  return "medium";
}

function normalizeKey(str: string = "") {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}