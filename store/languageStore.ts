import { create } from "zustand";
import { persist } from "zustand/middleware";
import i18n from "../i18n"; // αν δεν το έχεις ήδη, πρόσθεσέ το

type LanguageState = {
  language: string;
  setLanguage: (lang: string) => void;
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: i18n.locale,          // ⭐ παίρνει τη γλώσσα της συσκευής
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: "language-store",
    }
  )
);