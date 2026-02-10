import * as Localization from "expo-localization";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type LanguageState = {
  language: string;
  setLanguage: (lang: string) => void;
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      // ⭐ ΠΑΝΤΑ σωστό device locale
      language: Localization.getLocales()?.[0]?.languageCode || "en",

      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: "language-store",
    }
  )
);