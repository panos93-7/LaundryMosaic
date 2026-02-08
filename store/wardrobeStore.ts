import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

// ⭐ Correct canonical type
import { WardrobeCanonical } from "../utils/AI/SmartWardrobe/wardrobeCanonical";

/* --------------------------------------------- */
/* TYPES                                         */
/* --------------------------------------------- */

export type Garment = {
  id: number;

  // 🔥 ALWAYS natural English (AI canonical output)
  original: WardrobeCanonical;

  // 🔥 Translated or EN depending on locale
  profile: WardrobeCanonical;

  image?: string | null;
};

/* --------------------------------------------- */
/* STORE STATE                                   */
/* --------------------------------------------- */

type WardrobeState = {
  garments: Garment[];

  hydrate: () => Promise<void>;
  addGarment: (g: Garment) => Promise<void>;
  updateGarment: (g: { id: number; profile: WardrobeCanonical }) => Promise<void>;
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
        const parsed = JSON.parse(saved);

        // ⭐ Safety: ensure canonical structure
        const safe = Array.isArray(parsed) ? parsed : [];

        set({ garments: safe });
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

  /* UPDATE GARMENT — ONLY UPDATE PROFILE (SAFE) */
  updateGarment: async (g) => {
    try {
      const updated = get().garments.map((item) =>
        item.id === g.id
          ? {
              ...item,
              profile: g.profile, // 🔥 ONLY replace profile
            }
          : item
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