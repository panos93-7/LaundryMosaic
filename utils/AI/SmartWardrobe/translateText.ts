// utils/SmartWardrobe/translateText.ts

export async function translateText(text: string, locale: string): Promise<string> {
  if (!text) return "";

  try {
    const res = await fetch("https://gemini-proxy.panos-ai.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `Translate the following text into ${locale}. Return ONLY the translated text.\n\n"${text}"`,
      }),
    });

    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    return raw.trim();
  } catch (err) {
    console.log("❌ translateText error:", err);
    return text; // fallback
  }
}