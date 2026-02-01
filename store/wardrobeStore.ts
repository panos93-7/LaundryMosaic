import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { GarmentProfile } from "../utils/AI/translateGarment";

/* --------------------------------------------- */
/* TYPES                                         */
/* --------------------------------------------- */

export type Garment = {
  id: number;

  // 🔥 ALWAYS natural English (AI output)
  original: GarmentProfile;

  // 🔥 Translated or EN depending on locale
  profile: GarmentProfile;

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