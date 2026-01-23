import { GoogleGenerativeAI } from "@google/generative-ai";
import Constants from "expo-constants";
import { preprocessImage } from "./AI/preprocessImage";

const genAI = new GoogleGenerativeAI(
  Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY!
);

/**
 * PRO Fabric Analyzer
 * Analyzes a fabric image and returns:
 * - fabricType
 * - weave
 * - sensitivity
 * - recommended wash settings
 * - care instructions
 */
export async function analyzeFabricPro(base64: string) {
  try {
    // Clean base64 input (remove prefix if exists)
    const cleaned = base64.replace(/^data:.*;base64,/, "").trim();

    // Preprocess → returns { base64, mimeType }
    const { base64: processedBase64, mimeType } = await preprocessImage(
      `data:image/jpeg;base64,${cleaned}`
    );

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `
You are a textile and laundry expert. Analyze the fabric in the image and return ONLY valid JSON.

Extract the following fields:

- fabricType: (cotton, wool, linen, denim, polyester, nylon, silk, blend, fleece, viscose, acrylic)
- weave: (knit, woven, twill, satin, jersey, ribbed, canvas, unknown)
- sensitivity: (delicate, normal, durable)
- recommended: {
    temp: number (°C),
    spin: number (rpm),
    program: short wash program name
}
- careInstructions: array of 3–6 short bullet points

Return JSON in this exact format:

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

    // CORRECT GEMINI VISION FORMAT + FORCE API VERSION v1
    const result = await model.generateContent(
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: processedBase64,
                  mimeType: mimeType,
                },
              },
              { text: prompt },
            ],
          },
        ],
      },
      {
        apiVersion: "v1",
      }
    );

    let text = result.response.text();
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(text);

    return {
      fabricType: parsed.fabricType ?? "Unknown",
      weave: parsed.weave ?? "Unknown",
      sensitivity: parsed.sensitivity ?? "Normal",
      recommended: {
        temp: parsed.recommended?.temp ?? 30,
        spin: parsed.recommended?.spin ?? 800,
        program: parsed.recommended?.program ?? "Quick Wash",
      },
      careInstructions: Array.isArray(parsed.careInstructions)
        ? parsed.careInstructions
        : ["Wash at 30°C", "Use mild detergent", "Avoid high spin"],
    };
  } catch (err) {
    console.log("❌ analyzeFabricPro error:", err);
    return fallbackFabricPro();
  }
}

function fallbackFabricPro() {
  return {
    fabricType: "Unknown",
    weave: "Unknown",
    sensitivity: "Normal",
    recommended: {
      temp: 30,
      spin: 800,
      program: "Quick Wash",
    },
    careInstructions: [
      "Wash at 30°C",
      "Use mild detergent",
      "Avoid high spin",
    ],
  };
}