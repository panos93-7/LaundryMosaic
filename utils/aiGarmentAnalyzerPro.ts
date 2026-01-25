import { GoogleGenerativeAI } from "@google/generative-ai";
import { preprocessImage } from "./AI/preprocessImage";

// ⭐ Load API key from EAS secret / .env
const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.log("❌ Missing EXPO_PUBLIC_GEMINI_API_KEY");
}

const genAI = new GoogleGenerativeAI(apiKey!);

export async function analyzeGarmentPro(base64: string) {
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
You are an expert fashion and laundry assistant. Analyze the garment in the image and return ONLY valid JSON.

Extract the following fields:

- name
- type
- category
- fabric
- color
- pattern
- stains: array
- recommended: { temp, spin, program }

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

    const result = await model.generateContent({
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
    });

    let text = result.response.text() || "";
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(text);
    return parsed;

  } catch (err) {
    console.log("❌ PRO analyzer error:", err);
    return null;
  }
}