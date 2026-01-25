export async function analyzeImageWithGemini({
  base64,
  prompt,
}: {
  base64: string;
  prompt: string;
}) {
  try {
    // Remove base64 prefix if present
    const cleanedBase64 = base64.replace(/^data:image\/\w+;base64,/, "");

    // Detect mime type
    const mimeType = base64.startsWith("data:image/png")
      ? "image/png"
      : "image/jpeg";

    const response = await fetch(
      "https://gemini-proxy.panos-ai.workers.dev",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: cleanedBase64,
          mimeType,
          prompt,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error("Worker error: " + err);
    }

    const data = await response.json();

    // -----------------------------
    //  BULLETPROOF JSON EXTRACTION
    // -----------------------------
    let rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean markdown fences
    const cleaned = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("❌ Failed to parse JSON:", cleaned);
      throw new Error("Invalid JSON returned from Worker");
    }

    return parsed;

  } catch (error: any) {
    console.error("Gemini Worker Error:", error.message);
    throw error;
  }
}