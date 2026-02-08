import { stainTipsCache } from "./stainTipsCache";

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

    if (!response.ok) return fabricAwareFallback(stain, fabric);

    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!raw.startsWith("{") || !raw.endsWith("}"))
      return fabricAwareFallback(stain, fabric);

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return fabricAwareFallback(stain, fabric);
    }

    return {
      stain: parsed.stain ?? stain,
      fabric: parsed.fabric ?? fabric,
      steps: Array.isArray(parsed.steps)
        ? parsed.steps
            .filter((x: any) => typeof x === "string")
            .map((x: string) => x.trim())
        : [],
    };
  } catch (err: any) {
    if (err?.name === "AbortError") return fabricAwareFallback(stain, fabric);
    return fabricAwareFallback(stain, fabric);
  }
}

export async function generateStainRemovalTipsCached(
  stain: string,
  fabric: string,
  options: { signal?: AbortSignal } = {}
) {
  const { signal } = options;

  try {
    const cached = await stainTipsCache.get(stain, fabric);
    if (cached) return cached;

    const result = await generateStainRemovalTips(stain, fabric, { signal });

    await stainTipsCache.set(stain, fabric, result);

    return result;
  } catch (err: any) {
    if (err?.name === "AbortError") return fabricAwareFallback(stain, fabric);
    return fabricAwareFallback(stain, fabric);
  }
}

function buildPrompt(stain: string, fabric: string) {
  return `
You are a deterministic textile-care engine.

Return ONLY valid JSON. No markdown. No prose.

JSON schema:
{
  "stain": string,
  "fabric": string,
  "steps": string[]
}

Now return the JSON for:
Stain: "${stain}"
Fabric: "${fabric}"
`.trim();
}

function fabricAwareFallback(stain: string, fabric: string) {
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