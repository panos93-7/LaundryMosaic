// utils/SmartWardrobe/careSymbolMap.ts

/**
 * Mapping Vision enums → JSON translation keys
 *
 * Vision output examples:
 *   WashAt30
 *   DoNotBleach
 *   TumbleDryLow
 *   IronLow
 *   DoNotDryClean
 *
 * JSON keys (from your locale files):
 *   wash_30
 *   no_bleach
 *   tumble_low
 *   iron_low
 *   no_dryclean
 */

export const CARE_SYMBOL_MAP = {
  WashAt30: "wash_30",
  DoNotBleach: "no_bleach",
  TumbleDryLow: "tumble_low",
  IronLow: "iron_low",
  IronMedium: "iron_medium", // in case Vision ever outputs this
  DoNotDryClean: "no_dryclean",
} as const;