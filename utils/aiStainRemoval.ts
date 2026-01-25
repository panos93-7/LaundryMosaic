/**
 * Generate step-by-step stain removal instructions
 * based on stain + fabric using Cloudflare Worker.
 */
export async function generateStainRemovalTips(stain: string, fabric: string) {
  try {
    const response = await fetch(
      "https://gemini-proxy.panos-ai.workers.dev",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `
You are a professional textile care expert.

Provide a clear, step-by-step stain removal guide for:

Stain: "${stain}"
Fabric: "${fabric}"

Rules:
- Tailor instructions to the specific fabric type.
- Keep steps short, practical, and safe.
- Avoid harsh chemicals unless absolutely necessary.
- Return ONLY valid JSON in this format:

{
  "stain": "${stain}",
  "fabric": "${fabric}",
  "steps": [
    "Step 1...",
    "Step 2...",
    "Step 3..."
  ]
}
`
        }),
      }
    );

    if (!response.ok) {
      console.log("❌ Worker error:", await response.text());
      return fallback(stain, fabric);
    }

    const parsed = await response.json();

    return {
      stain: parsed.stain ?? stain,
      fabric: parsed.fabric ?? fabric,
      steps: Array.isArray(parsed.steps)
        ? parsed.steps
        : ["No steps provided"],
    };
  } catch (err) {
    console.log("❌ generateStainRemovalTips error:", err);
    return fallback(stain, fabric);
  }
}

function fallback(stain: string, fabric: string) {
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