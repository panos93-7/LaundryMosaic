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
        prompt: `
Translate the following JSON object into ${locale}.
Return ONLY valid JSON with the exact same structure and keys.
Do NOT add explanations.
Do NOT add code fences.
Do NOT add comments.

${JSON.stringify(canonical)}
        `,
      }),
    });

    const data = await res.json();
    let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // ⭐ HARDENING LAYER
    raw = raw.trim();

    // Remove code fences if present
    raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

    // Extract only the JSON part
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1) {
      raw = raw.substring(firstBrace, lastBrace + 1);
    }

    // Final parse
    return JSON.parse(raw);
  } catch (err) {
    console.log("❌ translateWardrobeBatch error:", err);
    return canonical; // fallback
  }
}