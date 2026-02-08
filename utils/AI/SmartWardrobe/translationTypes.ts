// utils/SmartWardrobe/translationTypes.ts

import { WardrobeCanonical } from "./wardrobeCanonical";

export type Locale = string;

export interface TranslationCache {
  get(garmentId: string, locale: Locale): Promise<WardrobeCanonical | null>;
  set(garmentId: string, locale: Locale, value: WardrobeCanonical): Promise<void>;
}