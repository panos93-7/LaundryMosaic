export async function generateStainRemovalTips(
  stain: string,
  fabric: string,
  options: { signal?: AbortSignal } = {}
) {
  const { signal } = options;

  try {
    const response = await fetch(
      "https://gemini-proxy.panos-ai.workers.dev",
      {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: buildPrompt(stain, fabric),
        }),
      }
    );

    if (!response.ok) {
      console.log("❌ StainTips worker error:", await response.text());
      return null;
    }

    const data = await response.json();
    let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    console.log("RAW STAIN TIPS OUTPUT:", raw);

    raw = raw.trim();

    // Extract JSON even if Gemini adds text around it
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");

    if (first === -1 || last === -1) {
      console.log("❌ No JSON found in stain tips:", raw);
      return null;
    }

    const jsonString = raw.slice(first, last + 1);

    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (err) {
      console.log("❌ StainTips JSON parse error:", jsonString);
      return null;
    }

    return parsed;
  } catch (err: any) {
    if (err?.name === "AbortError") return null;
    console.log("❌ generateStainRemovalTips fatal error:", err);
    return null;
  }
}

function buildPrompt(stain: string, fabric: string) {
  return `
You are a deterministic stain-removal engine.

Return ONLY valid JSON. No markdown. No prose. No explanations.

JSON schema:
{
  "steps": string[]
}

Rules:
- steps MUST be an array of strings.
- No extra fields.
- No nulls.
- No text outside JSON.

Stain: "${stain}"
Fabric: "${fabric}"
`.trim();
}