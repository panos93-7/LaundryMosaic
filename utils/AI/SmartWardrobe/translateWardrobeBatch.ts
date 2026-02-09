// utils/SmartWardrobe/translateWardrobeBatch.ts

export async function translateWardrobeBatch(
  canonical: any,
  locale: string
): Promise<any> {
  if (!canonical) return canonical;

  try {
    const res = await fetch("https://gemini-proxy.panos-ai.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        temperature: 0,
        prompt: `
Translate this JSON object into ${locale}.
Return ONLY valid JSON.
Do NOT add explanations.
Do NOT add comments.
Do NOT add code fences.

JSON:
${JSON.stringify(canonical)}
        `,
      }),
    });

    const data = await res.json();
    let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // ⭐ HARDENING LAYER
    raw = raw.trim();
    raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1) {
      raw = raw.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(raw);
  } catch (err) {
    console.log("❌ translateWardrobeBatch error:", err);
    return canonical; // fallback
  }
}