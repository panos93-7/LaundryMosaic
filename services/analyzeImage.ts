import { GoogleGenerativeAI } from "@google/generative-ai";
import Constants from "expo-constants";
import { getProgramFor } from "../constants/programMapping";

const genAI = new GoogleGenerativeAI(
  Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY!
);

export async function analyzeImageWithGemini(base64: string, mimeType?: string) {
  try {
    // ---------------------------------------------
    // 1) Clean base64 (remove prefix if exists)
    // ---------------------------------------------
    const cleanedBase64 = base64.replace(/^data:.*;base64,/, "").trim();

    // ---------------------------------------------
    // 2) Detect mimeType or fallback to jpeg
    // ---------------------------------------------
    const finalMime =
      mimeType ||
      (cleanedBase64.startsWith("/9j/") ? "image/jpeg" : "image/png");

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
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

    // ---------------------------------------------
    // 3) Gemini request
    // ---------------------------------------------
    const result = await model.generateContent({
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
    });

    // ---------------------------------------------
    // 4) Extract text safely
    // ---------------------------------------------
    let text = result.response.text() || "";
    text = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .replace(/[\u0000-\u001F]+/g, "")
      .trim();

    let parsed = null;

    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.log("❌ Gemini returned non-JSON:", text);
      return null;
    }

    // ---------------------------------------------
    // 5) Validate essential fields
    // ---------------------------------------------
    if (!parsed || !parsed.fabric || !parsed.color) {
      console.log("❌ Gemini returned incomplete JSON:", parsed);
      return null;
    }

    // ---------------------------------------------
    // 6) Recommended program fallback
    // ---------------------------------------------
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

    // ---------------------------------------------
    // 7) Normalize stains
    // ---------------------------------------------
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