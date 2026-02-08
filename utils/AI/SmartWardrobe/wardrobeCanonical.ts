// utils/SmartWardrobe/wardrobeCanonical.ts
import * as Crypto from "expo-crypto";

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

  __locale?: string;
};

export async function wardrobeCanonicalKey(obj: WardrobeCanonical) {
  const { __locale, ...rest } = obj;
  const json = JSON.stringify(rest);

  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    json
  );
}