import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

// Canonical type
import { WardrobeCanonical } from "../utils/AI/SmartWardrobe/wardrobeCanonical";
import { WardrobeProfile } from "../utils/AI/SmartWardrobe/wardrobeProfile";

/* --------------------------------------------- */
/* TYPES                                         */
/* --------------------------------------------- */

export type Garment = {
  id: string; // ✔ FIXED — garmentId είναι string hash

  // Always natural English (AI canonical output)
  original: WardrobeCanonical;

  // Translated or EN depending on locale
  profile: WardrobeProfile;

  image?: string | null;
};

/* --------------------------------------------- */
/* STORE STATE                                   */
/* --------------------------------------------- */

type WardrobeState = {
  garments: Garment[];

  hydrate: () => Promise<void>;
  addGarment: (g: Garment) => Promise<void>;

  // Update canonical + profile + image
  updateGarment: (g: Partial<Garment> & { id: string }) => Promise<void>;

  deleteGarment: (id: string) => Promise<void>;
};

const STORAGE_KEY = "wardrobe";

/* --------------------------------------------- */
/* STORE IMPLEMENTATION                          */
/* --------------------------------------------- */

export const useWardrobeStore = create<WardrobeState>((set, get) => ({
  garments: [],

  hydrate: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const safe = Array.isArray(parsed) ? parsed : [];
        set({ garments: safe });
      }
    } catch (err) {
      console.log("Wardrobe hydrate error:", err);
    }
  },

  addGarment: async (g) => {
    try {
      const updated = [...get().garments, g];
      set({ garments: updated });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.log("Wardrobe add error:", err);
    }
  },

  updateGarment: async (g) => {
    try {
      const updated = get().garments.map((item) =>
        item.id === g.id
          ? {
              ...item,
              original: g.original ?? item.original,
              profile: g.profile ?? item.profile,
              image: g.image ?? item.image,
            }
          : item
      );

      set({ garments: updated });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.log("Wardrobe update error:", err);
    }
  },

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