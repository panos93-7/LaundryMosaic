// utils/SmartWardrobe/translationTypes.ts

export type Locale = string;

export interface TranslationCache {
  get(garmentId: string, locale: Locale): Promise<any | null>;
  set(garmentId: string, locale: Locale, value: any): Promise<void>;
}