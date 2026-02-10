// utils/AI/AILaundryAssistant/generateLaundryAdviceCached.ts
import { aiLaundryCache } from "./aiLaundryCache";
import { generateLaundryCanonical, LaundryCanonical } from "./aiLaundryCanonical";
import { translateLaundry } from "./translateLaundry";

export async function generateLaundryAdviceCached({
  canonicalKey,
  userQuery,
  targetLocale,
}: {
  canonicalKey: string;
  userQuery: string;
  targetLocale: string;
}) {
  // 1) Canonical (EN) from cache or AI
  let canonical: LaundryCanonical | null = await aiLaundryCache.get(
    canonicalKey,
    "canonical"
  );

  if (!canonical) {
    const aiCanonical = await generateLaundryCanonical(userQuery);
    canonical = aiCanonical;
    await aiLaundryCache.set(canonicalKey, "canonical", canonical);
  }

  const normalizedLocale = (targetLocale || "en").split("-")[0].toLowerCase();

// Always translate unless locale === "en"
if (normalizedLocale === "en") {
  return { canonical, translated: canonical };
}

  // 2) Translation from cache
  const subKey = `translated_${normalizedLocale}`;
  let translated: LaundryCanonical | null = await aiLaundryCache.get(
    canonicalKey,
    subKey
  );

  // 3) If no translation → translate once
  if (!translated) {
    translated = await translateLaundry(canonical, normalizedLocale);
    await aiLaundryCache.set(canonicalKey, subKey, translated);
  }

  return { canonical, translated };
}