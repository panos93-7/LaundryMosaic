// utils/SmartWardrobe/translateText.ts

export async function translateText(text: string, locale: string): Promise<string> {
  if (!text) return "";

  try {
    const res = await fetch("https://gemini-proxy.panos-ai.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        temperature: 0,
        prompt: `
Translate the following text into ${locale}.
Return ONLY the translated text.
Do NOT add quotes.
Do NOT add markdown.
Do NOT add explanations.
Do NOT add JSON.
Do NOT add code fences.

TEXT:
${text}
        `,
      }),
    });

    const data = await res.json();
    let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // ⭐ HARDENING LAYER
    raw = raw.trim();

    // Remove code fences
    raw = raw.replace(/```/g, "").trim();

    // Remove surrounding quotes
    raw = raw.replace(/^["'“”«»]+/, "").replace(/["'“”«»]+$/, "").trim();

    // Remove trailing garbage tokens
    raw = raw.replace(/<\/s>$/i, "").trim();

    // If empty → fallback
    if (!raw) return text;

    return raw;
  } catch (err) {
    console.log("❌ translateText error:", err);
    return text; // fallback
  }
}