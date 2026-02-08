// ULTRA‑PREMIUM, CANONICAL, DETERMINISTIC VERSION

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
      console.log("❌ Worker error:", await response.text());
      return fabricAwareFallback(stain, fabric);
    }

    const data = await response.json();

    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!rawText.startsWith("{") || !rawText.endsWith("}")) {
      console.log("❌ Invalid JSON envelope:", rawText);
      return fabricAwareFallback(stain, fabric);
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (err) {
      console.log("❌ JSON parse error:", rawText);
      return fabricAwareFallback(stain, fabric);
    }

    // Canonical output
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
    if (err.name === "AbortError") {
      console.log("⛔ generateStainRemovalTips aborted");
      return fabricAwareFallback(stain, fabric);
    }

    console.log("❌ generateStainRemovalTips fatal error:", err);
    return fabricAwareFallback(stain, fabric);
  }
}

/* -------------------------------------------------------------------------- */
/*                               CANONICAL PROMPT                             */
/* -------------------------------------------------------------------------- */

function buildPrompt(stain: string, fabric: string) {
  return `
You are a deterministic textile-care engine.

Return ONLY valid JSON. No markdown. No prose. No explanations.
Never wrap the JSON in backticks. Never include comments.

JSON schema:
{
  "stain": string,
  "fabric": string,
  "steps": string[]
}

Rules:
- Tailor steps to the specific fabric.
- Keep steps short, safe, and practical.
- Avoid harsh chemicals unless absolutely necessary.
- No extra fields. No text outside JSON.
- Steps must be an array of short strings.
- Never mention that you are an AI.

Now return the JSON for:
Stain: "${stain}"
Fabric: "${fabric}"
`.trim();
}

/* -------------------------------------------------------------------------- */
/*                         FABRIC‑AWARE MULTILINGUAL FALLBACK                 */
/* -------------------------------------------------------------------------- */

function fabricAwareFallback(stain: string, fabric: string) {
  const f = fabric.toLowerCase();

  // Greek or English depending on device locale
  const isGreek =
    typeof navigator !== "undefined" &&
    navigator.language &&
    navigator.language.startsWith("el");

  const t = (en: string, el: string) => (isGreek ? el : en);

  // Fabric‑specific safe fallback
  if (f.includes("silk") || f.includes("satin")) {
    return {
      stain,
      fabric,
      steps: [
        t("Blot gently with cold water", "Ταμπονάρετε απαλά με κρύο νερό"),
        t("Apply a small amount of gentle silk detergent",
          "Εφαρμόστε μικρή ποσότητα απαλού απορρυπαντικού για μετάξι"),
        t("Rinse carefully without rubbing",
          "Ξεπλύνετε προσεκτικά χωρίς τρίψιμο"),
      ],
    };
  }

  if (f.includes("wool") || f.includes("cashmere")) {
    return {
      stain,
      fabric,
      steps: [
        t("Blot with cold water", "Ταμπονάρετε με κρύο νερό"),
        t("Use wool-safe detergent only",
          "Χρησιμοποιήστε μόνο απορρυπαντικό για μάλλινα"),
        t("Rinse gently and reshape fabric",
          "Ξεπλύνετε απαλά και επαναφέρετε το σχήμα"),
      ],
    };
  }

  if (f.includes("leather") || f.includes("suede")) {
    return {
      stain,
      fabric,
      steps: [
        t("Blot without water to avoid damage",
          "Ταμπονάρετε χωρίς νερό για να μην καταστραφεί"),
        t("Use a leather-safe cleaner",
          "Χρησιμοποιήστε καθαριστικό κατάλληλο για δέρμα"),
        t("Let it air dry away from heat",
          "Αφήστε να στεγνώσει φυσικά, μακριά από θερμότητα"),
      ],
    };
  }

  if (f.includes("denim")) {
    return {
      stain,
      fabric,
      steps: [
        t("Rinse with cold water", "Ξεπλύνετε με κρύο νερό"),
        t("Apply mild detergent directly on stain",
          "Εφαρμόστε απαλό απορρυπαντικό πάνω στον λεκέ"),
        t("Rinse and repeat if needed",
          "Ξεπλύνετε και επαναλάβετε αν χρειαστεί"),
      ],
    };
  }

  // Default fallback (cotton, synthetics, unknown)
  return {
    stain,
    fabric,
    steps: [
      t("Blot gently with cold water", "Ταμπονάρετε απαλά με κρύο νερό"),
      t("Apply mild detergent", "Εφαρμόστε απαλό απορρυπαντικό"),
      t("Rinse and repeat if needed", "Ξεπλύνετε και επαναλάβετε αν χρειαστεί"),
    ],
  };
}