import { GoogleGenerativeAI } from "@google/generative-ai";
import { preprocessImage } from "./AI/preprocessImage";

// ⭐ Load API key from EAS secret / .env
const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.log("❌ Missing EXPO_PUBLIC_GEMINI_API_KEY");
}

const genAI = new GoogleGenerativeAI(apiKey!);

export async function analyzeFabricPro(base64: string) {
  try {
    const cleaned = base64.replace(/^data:.*;base64,/, "").trim();

    const { base64: processedBase64, mimeType } = await preprocessImage(
      `data:image/jpeg;base64,${cleaned}`
    );

    // ⭐ Correct model
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-pro",
    });

    const prompt = `
You are a textile and laundry expert. Analyze the fabric in the image and return ONLY valid JSON.

Extract the following fields:

- fabricType
- weave
- sensitivity
- recommended: { temp, spin, program }
- careInstructions: array of bullet points

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
      { apiVersion: "v1" }
    );

    let text = result.response.text() || "";
    text = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

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