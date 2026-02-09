import { WardrobeCanonical } from "./wardrobeCanonical";

export type WardrobeProfile = WardrobeCanonical & {
  careSymbolLabels: Record<string, string>;
  __locale: string;
};