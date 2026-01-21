// ---------------------------------------------
// TYPES
// ---------------------------------------------
export type FabricType = "cotton" | "synthetics" | "wool" | "delicate";
export type ColorType = "white" | "colored" | "dark" | "any";

export interface ProgramSettings {
  temp: number;
  spin: number;
  program: string;
}

// ---------------------------------------------
// PROGRAM MAP
// ---------------------------------------------
export const WashingPrograms: Record<FabricType, Record<ColorType, ProgramSettings>> = {
  cotton: {
    white: { temp: 60, spin: 1000, program: "Cotton Intensive" },
    colored: { temp: 40, spin: 1000, program: "Cotton Colors" },
    dark: { temp: 40, spin: 800, program: "Dark Care" },
    any: { temp: 40, spin: 800, program: "Cotton Default" }, // fallback
  },

  synthetics: {
    white: { temp: 40, spin: 800, program: "Synthetics" },
    colored: { temp: 30, spin: 800, program: "Synthetics Color" },
    dark: { temp: 30, spin: 600, program: "Dark Synthetic" },
    any: { temp: 40, spin: 800, program: "Synthetics Default" },
  },

  wool: {
    any: { temp: 20, spin: 400, program: "Wool / Hand Wash" },
    white: { temp: 20, spin: 400, program: "Wool / Hand Wash" },
    colored: { temp: 20, spin: 400, program: "Wool / Hand Wash" },
    dark: { temp: 20, spin: 400, program: "Wool / Hand Wash" },
  },

  delicate: {
    any: { temp: 30, spin: 600, program: "Delicates" },
    white: { temp: 30, spin: 600, program: "Delicates" },
    colored: { temp: 30, spin: 600, program: "Delicates" },
    dark: { temp: 30, spin: 600, program: "Delicates" },
  },
};

// ---------------------------------------------
// AUTO‑MAPPING FUNCTION
// ---------------------------------------------
export function getProgramFor(fabric: string, color: string): ProgramSettings | null {
  const fabricKey = fabric as FabricType;
  const colorKey = color as ColorType;

  const fabricGroup = WashingPrograms[fabricKey];
  if (!fabricGroup) return null;

  // Exact match (e.g. cotton + white)
  if (fabricGroup[colorKey]) return fabricGroup[colorKey];

  // Fallback to "any"
  if (fabricGroup["any"]) return fabricGroup["any"];

  return null;
}