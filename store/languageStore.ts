import { create } from "zustand";
import { persist } from "zustand/middleware";

type LanguageState = {
  language: string;
  setLanguage: (lang: string) => void;
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "en",
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: "language-store", // key in AsyncStorage
    }
  )
);