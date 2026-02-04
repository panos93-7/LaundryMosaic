import i18n from "../../i18n";
import { translationCacheStains } from "./translationCacheStains";

function hashSteps(steps: string[]) {
  return steps.join("|").toLowerCase();
}

export async function translateStainTips(
  tips: any,
  locale: string,
  cacheKeyPrefix: string
) {
  // 🔥 Always sanitize input
  const safeTips = Array.isArray(tips) ? tips : [];

  // English → no translation needed
  if (locale === "en") return safeTips;

  const stepsHash = hashSteps(safeTips);
  const cacheKey = `${cacheKeyPrefix}_${locale}_${stepsHash}`;

  // 1) Check deduped cache
  const cached = translationCacheStains.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2) Translate each tip safely
  const translated = safeTips.map((tip) =>
    i18n.t("stainTips.dynamic", { tip })
  );

  // 3) Save deduped translation
  translationCacheStains.set(cacheKey, JSON.stringify(translated));

  return translated;
}