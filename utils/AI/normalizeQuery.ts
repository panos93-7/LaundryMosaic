import i18n from "../../i18n";

/**
 * Normalizes user queries so that:
 * - cache keys are stable
 * - language changes do NOT affect caching
 * - AI receives consistent English input
 */
export async function normalizeQuery(query: string): Promise<string> {
  if (!query || typeof query !== "string") return "";

  try {
    // Translate the user query to English
    const english = i18n.t(query, { locale: "en" });

    // If translation fails or returns the same text, fallback to original
    if (!english || english === query) {
      return query.trim().toLowerCase();
    }

    return english.trim().toLowerCase();
  } catch {
    return query.trim().toLowerCase();
  }
}