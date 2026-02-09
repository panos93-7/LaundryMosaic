// utils/SmartWardrobe/resolveLocale.ts
import { Locale } from "./translationTypes";

const SUPPORTED: Locale[] = [
  "en",
  "el",
  "es",
  "fr",
  "de",
  "it",
  "tr",
  "ru",
  "ja",
  "ko",
  "zh-TW",
  "pt-PT",
  "pt-BR",
];

export function resolveLocale(raw: string | undefined | null): Locale {
  if (!raw) return "en";

  const normalized = raw.toLowerCase();

  // Exact match
  if (SUPPORTED.includes(normalized as Locale)) {
    return normalized as Locale;
  }

  // Base language match (e.g. "el-GR" → "el")
  const base = normalized.split("-")[0];
  if (SUPPORTED.includes(base as Locale)) {
    return base as Locale;
  }

  // Portuguese special case
  if (base === "pt") return "pt-PT";

  return "en";
}