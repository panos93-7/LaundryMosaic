import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

/* --------------------------------------------- */
/* TYPES                                         */
/* --------------------------------------------- */

export type RecommendedWash = {
  program: string;
  temp: number;
  spin: number;
};

export type Fabric = {
  id: number;
  name: string;
  description?: string;
  image?: string | null;

  // PRO AI fields
  fabricType?: string;
  weave?: string;
  sensitivity?: string;
  recommended?: RecommendedWash;
  careInstructions?: string[];

  // Future-proof fields (optional)
  // fiberComposition?: string;
  // gsm?: number;
  // stretchLevel?: string;
};

/* --------------------------------------------- */
/* STORE STATE                                   */
/* --------------------------------------------- */

type FabricsState = {
  fabrics: Fabric[];

  hydrate: () => Promise<void>;
  addFabric: (f: Fabric) => Promise<void>;
  updateFabric: (f: Fabric) => Promise<void>;
  deleteFabric: (id: number) => Promise<void>;
};

const STORAGE_KEY = "customFabrics";

/* --------------------------------------------- */
/* STORE IMPLEMENTATION                          */
/* --------------------------------------------- */

export const useFabricsStore = create<FabricsState>((set, get) => ({
  fabrics: [],

  /* LOAD FROM STORAGE */
  hydrate: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        set({ fabrics: JSON.parse(saved) });
      }
    } catch (err) {
      console.log("FabricsStore hydrate error:", err);
    }
  },

  /* ADD FABRIC */
  addFabric: async (f) => {
    try {
      const updated = [...get().fabrics, f];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      set({ fabrics: updated });
    } catch (err) {
      console.log("FabricsStore addFabric error:", err);
    }
  },

  /* UPDATE FABRIC */
  updateFabric: async (f) => {
    try {
      const updated = get().fabrics.map((item) =>
        item.id === f.id ? { ...item, ...f } : item
      );

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      set({ fabrics: updated });
    } catch (err) {
      console.log("FabricsStore updateFabric error:", err);
    }
  },

  /* DELETE FABRIC */
  deleteFabric: async (id) => {
    try {
      const updated = get().fabrics.filter((f) => f.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      set({ fabrics: updated });
    } catch (err) {
      console.log("FabricsStore deleteFabric error:", err);
    }
  },
}));