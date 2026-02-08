export async function analyzeImageWithGemini({
  base64,
  prompt,
}: {
  base64: string;
  prompt: string;
}) {
  try {
    const cleanedBase64 = base64
      ? base64.replace(/^data:image\/\w+;base64,/, "")
      : null;

    const mimeType = base64?.startsWith("data:image/png")
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

    // Extract text safely
    let rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.text ||
      data?.output ||
      "";

    if (typeof rawText !== "string") {
      rawText = JSON.stringify(rawText);
    }

    const cleaned = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    if (!cleaned || cleaned.length < 2) {
      return [];
    }

    let parsed: any = null;

    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("❌ Failed to parse JSON:", cleaned);
      return [];
    }

    // Normalize output
    if (Array.isArray(parsed)) {
      return parsed.filter((x) => typeof x === "string");
    }

    if (Array.isArray(parsed?.steps)) {
      return parsed.steps.filter((step: any) => typeof step === "string");
    }

    if (Array.isArray(parsed?.tips)) {
      return parsed.tips.filter((tip: any) => typeof tip === "string");
    }

    if (typeof parsed === "string") {
      return [parsed];
    }

    if (typeof parsed?.text === "string") {
      return [parsed.text];
    }

    return [];
  } catch (error: any) {
    console.error("Gemini Worker Error:", error.message);
    return [];
  }
}

/**
 * ⭐ TEXT‑ONLY TRANSLATION ENDPOINT
 * Χρησιμοποιείται ΜΟΝΟ για μεταφράσεις.
 */
export async function analyzeTextWithGemini(prompt: string) {
  try {
    const response = await fetch(
      "https://gemini-proxy.panos-ai.workers.dev",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          imageBase64: null, // ⭐ text-only mode
          mimeType: null,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error("Worker error: " + err);
    }

    const data = await response.json();

    let rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.text ||
      data?.output ||
      "";

    if (typeof rawText !== "string") {
      rawText = JSON.stringify(rawText);
    }

    const cleaned = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    if (!cleaned || cleaned.length < 2) {
      return [];
    }

    try {
      return JSON.parse(cleaned);
    } catch {
      return [];
    }
  } catch (err) {
    console.error("Gemini Text Error:", err);
    return [];
  }
}