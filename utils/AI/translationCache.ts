import AsyncStorage from "@react-native-async-storage/async-storage";
import { AI_CACHE_VERSION } from "./aiCache"; // ⭐ version import
import { GarmentProfile, Locale, TranslationCache } from "./translateGarment";

// ⭐ Versioned key
const makeKey = (garmentId: string, locale: Locale) =>
  `v${AI_CACHE_VERSION}:garment:${garmentId}:${locale}`;

export const translationCache: TranslationCache = {
  async get(garmentId: string, locale: Locale) {
    try {
      const key = makeKey(garmentId, locale);
      const json = await AsyncStorage.getItem(key);

      if (!json) return null;

      const parsed = JSON.parse(json);

      // Safety: ensure __locale exists
      if (!parsed.__locale) {
        parsed.__locale = locale;
      }

      return parsed as GarmentProfile;
    } catch (err) {
      console.log("⚠️ translationCache.get error:", err);
      return null;
    }
  },

  async set(garmentId: string, locale: Locale, value: GarmentProfile) {
    try {
      const key = makeKey(garmentId, locale);

      // Ensure locale metadata is stored
      const toStore = { ...value, __locale: locale };

      await AsyncStorage.setItem(key, JSON.stringify(toStore));
    } catch (err) {
      console.log("⚠️ translationCache.set error:", err);
    }
  }
};