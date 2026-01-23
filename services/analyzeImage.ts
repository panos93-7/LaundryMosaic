import { GoogleGenerativeAI } from "@google/generative-ai";
import Constants from "expo-constants";
import { getProgramFor } from "../constants/programMapping";

const genAI = new GoogleGenerativeAI(
  Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY!
);

export async function analyzeImageWithGemini(base64: string, mimeType?: string) {
  try {
    const cleanedBase64 = base64.replace(/^data:.*;base64,/, "").trim();

    const finalMime =
      mimeType ||
      (cleanedBase64.startsWith("/9j/") ? "image/jpeg" : "image/png");

    const model = genAI.getGenerativeModel({
      model: "gemini-1.0-pro-vision",
    });

    const prompt = `
You are an expert laundry assistant. Analyze the image and return ONLY valid JSON.

Extract:
- fabric type (cotton, synthetics, wool, delicate)
- color category (white, colored, dark)
- stains (array)
- recommended washing settings:
  - temp (°C)
  - spin (rpm)
  - program (short name)

Return JSON in this exact format:

{
  "fabric": "...",
  "color": "...",
  "stains": ["..."],
  "recommended": {
    "temp": 40,
    "spin": 1000,
    "program": "Cotton Colors"
  }
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
                  data: cleanedBase64,
                  mimeType: finalMime,
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
      .replace(/[\u0000-\u001F]+/g, "")
      .trim();

    let parsed = null;

    try {
      parsed = JSON.parse(text);
    } catch {
      console.log("❌ Gemini returned non-JSON:", text);
      return null;
    }

    if (!parsed || !parsed.fabric || !parsed.color) {
      console.log("❌ Gemini returned incomplete JSON:", parsed);
      return null;
    }

    if (!parsed.recommended) {
      parsed.recommended = getProgramFor(parsed.fabric, parsed.color) || {
        temp: 30,
        spin: 800,
        program: "Quick Wash",
      };
    }

    parsed.recommended = {
      temp: parsed.recommended.temp ?? 30,
      spin: parsed.recommended.spin ?? 800,
      program: parsed.recommended.program ?? "Quick Wash",
    };

    if (!Array.isArray(parsed.stains)) {
      parsed.stains = [];
    }

    parsed.stains = parsed.stains.map((s: string) =>
      s.toLowerCase().trim()
    );

    return parsed;
  } catch (err) {
    console.log("❌ Gemini error:", err);
    return null;
  }
}