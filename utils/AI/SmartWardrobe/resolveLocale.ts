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

  if (SUPPORTED.includes(raw as Locale)) return raw as Locale;

  const base = raw.split("-")[0]; // π.χ. "el-GR" → "el"
  if (SUPPORTED.includes(base as Locale)) return base as Locale;

  return "en";
}