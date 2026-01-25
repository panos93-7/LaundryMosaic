import { GoogleGenerativeAI } from "@google/generative-ai";

// ⭐ Load API key from EAS secret / .env
const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.log("❌ Missing EXPO_PUBLIC_GEMINI_API_KEY");
}

const genAI = new GoogleGenerativeAI(apiKey!);

/**
 * Generate step-by-step stain removal instructions
 * based on stain + fabric.
 */
export async function generateStainRemovalTips(stain: string, fabric: string) {
  try {
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-pro",
    });

    const prompt = `
You are a professional textile care expert.

Provide a clear, step-by-step stain removal guide for:

Stain: "${stain}"
Fabric: "${fabric}"

Rules:
- Tailor instructions to the specific fabric type.
- Keep steps short, practical, and safe.
- Avoid harsh chemicals unless absolutely necessary.
- Return ONLY valid JSON in this format:

{
  "stain": "${stain}",
  "fabric": "${fabric}",
  "steps": [
    "Step 1...",
    "Step 2...",
    "Step 3..."
  ]
}
`;

    const result = await model.generateContent(prompt);

    let text = result.response.text() || "";

    // Clean markdown wrappers
    text = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(text);

    return {
      stain: parsed.stain ?? stain,
      fabric: parsed.fabric ?? fabric,
      steps: Array.isArray(parsed.steps)
        ? parsed.steps
        : ["No steps provided"],
    };
  } catch (err) {
    console.log("❌ generateStainRemovalTips error:", err);

    return {
      stain,
      fabric,
      steps: [
        "Blot gently with cold water",
        "Apply mild detergent",
        "Rinse and repeat if needed",
      ],
    };
  }
}