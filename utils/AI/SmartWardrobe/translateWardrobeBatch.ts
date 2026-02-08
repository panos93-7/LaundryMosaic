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
Do not add or remove fields.
Do not explain anything.

${JSON.stringify(canonical)}
        `,
      }),
    });

    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    return JSON.parse(raw);
  } catch (err) {
    console.log("❌ translateWardrobeBatch error:", err);
    return canonical; // fallback
  }
}