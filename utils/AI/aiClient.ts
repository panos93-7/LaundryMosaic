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

    const json = await response.json();

    // Optional: validate JSON structure
    if (!json || typeof json !== "object") {
      throw new Error("Invalid JSON returned from Worker");
    }

    return json;
  } catch (error: any) {
    console.error("Gemini Worker Error:", error.message);
    throw error;
  }
}