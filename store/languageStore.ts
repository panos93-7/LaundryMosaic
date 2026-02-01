import { create } from "zustand";

type LanguageState = {
  language: string;
  setLanguage: (lang: string) => void;
};

export const useLanguageStore = create<LanguageState>((set) => ({
  language: "en",
  setLanguage: (lang) => set({ language: lang }),
}));