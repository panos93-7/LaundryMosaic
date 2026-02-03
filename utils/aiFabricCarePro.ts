import i18n from "../i18n";

/**
 * AI Laundry Assistant — Minimal Chat Version
 * No schema, no JSON, no fallback.
 * The AI simply answers in the user's language.
 */

export async function generateCareInstructionsPro(userMessage: string) {
  const userLanguage = (i18n as any).language;

  try {
    const response = await fetch(
      "https://gemini-proxy.panos-ai.workers.dev",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `
You are an AI Laundry Assistant.

IMPORTANT RULES:
- Always answer ONLY in the following language: "${userLanguage}".
- Never answer in English unless the userLanguage is "en".
- Your tone must be friendly, helpful, and concise.
- Provide clear laundry care advice based on the user's question.
- Do NOT return JSON. Do NOT return code blocks. Only natural text.

User question:
"${userMessage}"
`
        }),
      }
    );

    if (!response.ok) {
      console.log("❌ Worker error:", await response.text());
      return String(i18n.t("aiAssistant.error"));
    }

    const data = await response.json();

    // Extract plain text from Gemini response
    const aiText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      String(i18n.t("aiAssistant.noAnswer"));

    return aiText;

  } catch (err) {
    console.log("❌ generateCareInstructionsPro error:", err);
    return String(i18n.t("aiAssistant.error"));
  }
}