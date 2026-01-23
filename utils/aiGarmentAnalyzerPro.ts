import { GoogleGenerativeAI } from "@google/generative-ai";
import Constants from "expo-constants";
import { preprocessImage } from "./AI/preprocessImage";

const genAI = new GoogleGenerativeAI(
  Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY!
);

export async function analyzeGarmentPro(base64: string) {
  try {
    // Clean base64 input (remove prefix if exists)
    const cleaned = base64.replace(/^data:.*;base64,/, "").trim();

    // Preprocess → returns { base64, mimeType }
    const { base64: processedBase64, mimeType } = await preprocessImage(
      `data:image/jpeg;base64,${cleaned}`
    );

    const model = genAI.getGenerativeModel({
      model: "gemini-1.0-pro-vision-latest",
    });

    const prompt = `
You are an expert fashion and laundry assistant. Analyze the garment in the image and return ONLY valid JSON.

Extract the following fields:

- name: a short human-friendly garment name combining color + fabric + type (e.g. "Brown Wool Sweater")
- type: (t-shirt, hoodie, sweater, shirt, jeans, pants, shorts, skirt, dress, jacket, coat, underwear, socks, accessory)
- category: (top, bottom, outerwear, underwear, accessory)
- fabric: (cotton, wool, denim, polyester, nylon, linen, silk, blend, synthetic)
- color: (white, black, gray, beige, brown, blue, red, green, yellow, multicolor)
- pattern: (solid, striped, plaid, printed, textured, knitted)
- stains: array of detected stains (or empty array)
- recommended: {
    temp: number,
    spin: number,
    program: string
  }

Return ONLY valid JSON in this exact format:

{
  "name": "...",
  "type": "...",
  "category": "...",
  "fabric": "...",
  "color": "...",
  "pattern": "...",
  "stains": ["..."],
  "recommended": {
    "temp": 30,
    "spin": 800,
    "program": "Quick Wash"
  }
}
`;

    // FORCE API VERSION v1 — no underline, no warnings
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

    return parsed;
  } catch (err) {
    console.log("❌ PRO analyzer error:", err);
    return null;
  }
}