// utils/SmartWardrobe/wardrobeCanonical.ts

export type WardrobeCanonical = {
  name: string;
  type: string;
  category: string;
  fabric: string;
  color: string;
  pattern: string;

  stains: string[];
  stainTips: string[];

  recommended: {
    program: string;
    temp: number;
    spin: number;
    detergent: string;
    notes: string[];
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

  washFrequency: string;
  careSymbols: string[];
};