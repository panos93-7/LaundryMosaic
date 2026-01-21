import { create } from "zustand";

export interface ScanRecommended {
  temp: number | null;
  spin: number | null;
  program: string | null;
}

export interface ScanState {
  fabric: string | null;
  color: string | null;
  stains: string[];
  recommended: ScanRecommended;

  // PRO AI fields (optional)
  category?: string | null;
  pattern?: string | null;
  sensitivity?: string | null;
  fabricType?: string | null;
  weave?: string | null;

  setScanResult: (data: Partial<ScanState>) => void;
  resetScan: () => void;
}

export const useScanStore = create<ScanState>((set) => ({
  fabric: null,
  color: null,
  stains: [],
  recommended: { temp: null, spin: null, program: null },

  // PRO fields default
  category: null,
  pattern: null,
  sensitivity: null,
  fabricType: null,
  weave: null,

  setScanResult: (data) =>
    set((state) => ({
      ...state,
      ...data, // MERGE, not replace
    })),

  resetScan: () =>
    set({
      fabric: null,
      color: null,
      stains: [],
      recommended: { temp: null, spin: null, program: null },
      category: null,
      pattern: null,
      sensitivity: null,
      fabricType: null,
      weave: null,
    }),
}));