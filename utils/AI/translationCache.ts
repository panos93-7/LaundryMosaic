import AsyncStorage from "@react-native-async-storage/async-storage";
import { GarmentProfile, Locale, TranslationCache } from "./translateGarment";

export const translationCache: TranslationCache = {
  async get(garmentId: string, locale: Locale) {
    try {
      const key = `garment:${garmentId}:${locale}`;
      const json = await AsyncStorage.getItem(key);
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  },

  async set(garmentId: string, locale: Locale, value: GarmentProfile) {
    try {
      const key = `garment:${garmentId}:${locale}`;
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }
};