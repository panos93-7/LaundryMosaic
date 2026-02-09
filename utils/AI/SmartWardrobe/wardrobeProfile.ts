import { WardrobeCanonical } from "./wardrobeCanonical";

export type WardrobeProfile = WardrobeCanonical & {
  careSymbolLabels: Record<string, string>; // ALWAYS object

  recommended: {
    program: string;
    temp: number;
    spin: number;
    detergent?: string;
    notes?: string[];
  };

  care: {
    wash: string;
    bleach: string;
    dry: string;
    iron: string;
    dryclean: string;
    warnings: string[];
  };

  risks: {
    shrinkage: string;
    colorBleeding: string;
    delicacy: string;
  };

  stains: string[];
  stainTips: string[];

  washFrequency: string;

  __locale: string; // locale of this translated profile
};