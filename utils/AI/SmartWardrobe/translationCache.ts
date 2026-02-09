// utils/SmartWardrobe/translationCache.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { AI_CACHE_VERSION } from "../Core/aiCache";
import { Locale, TranslationCache } from "./translationTypes";

const makeKey = (garmentId: string, locale: Locale) =>
  `v${AI_CACHE_VERSION}:garment:${garmentId}:${locale}`;

export const translationCache: TranslationCache = {
  async get(garmentId: string, locale: Locale) {
    try {
      const key = makeKey(garmentId, locale);
      const json = await AsyncStorage.getItem(key);

      if (!json) return null;

      try {
        return JSON.parse(json);
      } catch {
        console.log("⚠️ translationCache.get: corrupted JSON");
        return null;
      }
    } catch (err) {
      console.log("⚠️ translationCache.get error:", err);
      return null;
    }
  },

  async set(garmentId: string, locale: Locale, value: any) {
    try {
      const key = makeKey(garmentId, locale);
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.log("⚠️ translationCache.set error:", err);
    }
  },
};