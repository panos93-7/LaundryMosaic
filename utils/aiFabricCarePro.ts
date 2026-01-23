import { GoogleGenerativeAI } from "@google/generative-ai";
import Constants from "expo-constants";

const genAI = new GoogleGenerativeAI(
  Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY!
);

/**
 * PRO Fabric Care Generator
 * Generates:
 * - fabricType (normalized)
 * - weave (guessed)
 * - sensitivity
 * - recommended wash settings
 * - care instructions
 */
export async function generateCareInstructionsPro(fabricName: string) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.0-pro-latest",
    });

    const prompt = `
You are a textile and laundry expert. Based ONLY on the fabric name "${fabricName}", return structured care information.

Extract the following fields:

- fabricType: normalized fabric type (cotton, wool, linen, denim, polyester, nylon, silk, blend, fleece, viscose, acrylic)
- weave: best guess (knit, woven, twill, satin, jersey, ribbed, canvas, unknown)
- sensitivity: (delicate, normal, durable)
- recommended: {
    temp: number (°C),
    spin: number (rpm),
    program: short wash program name
}
- careInstructions: array of 3–6 short bullet points

Return ONLY valid JSON in this exact format:

{
  "fabricType": "...",
  "weave": "...",
  "sensitivity": "...",
  "recommended": {
    "temp": 30,
    "spin": 800,
    "program": "Delicates"
  },
  "careInstructions": ["...", "..."]
}
`;

    const result = await model.generateContent(
      prompt,
      {
        apiVersion: "v1",
      }
    );

    let text = result.response.text();
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(text);

    return {
      fabricType: parsed.fabricType ?? normalizeFabric(fabricName),
      weave: parsed.weave ?? "Unknown",
      sensitivity: parsed.sensitivity ?? guessSensitivity(fabricName),
      recommended: {
        temp: parsed.recommended?.temp ?? 30,
        spin: parsed.recommended?.spin ?? 800,
        program: parsed.recommended?.program ?? "Quick Wash",
      },
      careInstructions: Array.isArray(parsed.careInstructions)
        ? parsed.careInstructions
        : defaultCare(fabricName),
    };
  } catch (err) {
    console.log("❌ generateCareInstructionsPro error:", err);
    return fallbackCare(fabricName);
  }
}

/* ----------------------------- */
/* HELPERS */
/* ----------------------------- */

function normalizeFabric(name: string) {
  const n = name.toLowerCase();
  if (n.includes("cotton")) return "cotton";
  if (n.includes("wool")) return "wool";
  if (n.includes("linen")) return "linen";
  if (n.includes("silk")) return "silk";
  if (n.includes("denim")) return "denim";
  if (n.includes("poly")) return "polyester";
  if (n.includes("nylon")) return "nylon";
  if (n.includes("viscose")) return "viscose";
  if (n.includes("acrylic")) return "acrylic";
  return "blend";
}

function guessSensitivity(name: string) {
  const n = name.toLowerCase();
  if (n.includes("wool") || n.includes("silk") || n.includes("cashmere"))
    return "delicate";
  if (n.includes("denim") || n.includes("canvas")) return "durable";
  return "normal";
}

function defaultCare(name: string) {
  const sensitivity = guessSensitivity(name);

  if (sensitivity === "delicate") {
    return [
      "Wash cold (20–30°C)",
      "Use wool/silk detergent",
      "Avoid high spin",
      "Air dry flat",
    ];
  }

  if (sensitivity === "durable") {
    return [
      "Wash at 40°C",
      "Normal detergent",
      "Medium spin",
      "Tumble dry low",
    ];
  }

  return [
    "Wash at 30°C",
    "Use mild detergent",
    "Avoid high spin",
    "Air dry",
  ];
}

function fallbackCare(name: string) {
  return {
    fabricType: normalizeFabric(name),
    weave: "Unknown",
    sensitivity: guessSensitivity(name),
    recommended: {
      temp: 30,
      spin: 800,
      program: "Quick Wash",
    },
    careInstructions: defaultCare(name),
  };
}