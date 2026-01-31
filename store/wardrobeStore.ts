import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

/* --------------------------------------------- */
/* TYPES                                         */
/* --------------------------------------------- */

export type RecommendedWash = {
  program: string;
  temp: string;
  spin: string;
  detergent: string;
  notes: string;
};

export type CareInstructions = {
  wash: string;
  bleach: string;
  dry: string;
  iron: string;
  dryclean: string;
  warnings: string[];
};

export type RiskProfile = {
  shrinkage: string;
  colorBleeding: string;
  delicacy: string;
};

export type Garment = {
  id: number;
  name: string;
  type: string;
  category?: string;

  color?: string;
  fabric?: string;
  pattern?: string;

  stains?: string[];

  recommended?: RecommendedWash;

  care?: CareInstructions;

  risks?: RiskProfile;

  washFrequency?: string;

  careSymbols?: string[];

  image?: string | null;
};

/* --------------------------------------------- */
/* STORE STATE                                   */
/* --------------------------------------------- */

type WardrobeState = {
  garments: Garment[];

  hydrate: () => Promise<void>;
  addGarment: (g: Garment) => Promise<void>;
  updateGarment: (g: Garment) => Promise<void>;
  deleteGarment: (id: number) => Promise<void>;
};

const STORAGE_KEY = "wardrobe";

/* --------------------------------------------- */
/* STORE IMPLEMENTATION                          */
/* --------------------------------------------- */

export const useWardrobeStore = create<WardrobeState>((set, get) => ({
  garments: [],

  /* LOAD FROM STORAGE */
  hydrate: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        set({ garments: JSON.parse(saved) });
      }
    } catch (err) {
      console.log("Wardrobe hydrate error:", err);
    }
  },

  /* ADD GARMENT */
  addGarment: async (g) => {
    try {
      const updated = [...get().garments, g];
      set({ garments: updated });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.log("Wardrobe add error:", err);
    }
  },

  /* UPDATE GARMENT (MERGE, NOT REPLACE) */
  updateGarment: async (g) => {
    try {
      const updated = get().garments.map((item) =>
        item.id === g.id ? { ...item, ...g } : item
      );

      set({ garments: updated });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.log("Wardrobe update error:", err);
    }
  },

  /* DELETE GARMENT */
  deleteGarment: async (id) => {
    try {
      const updated = get().garments.filter((g) => g.id !== id);
      set({ garments: updated });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.log("Wardrobe delete error:", err);
    }
  },
}));