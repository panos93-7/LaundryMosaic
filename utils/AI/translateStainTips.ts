import i18n from "../../i18n";
import { translationCacheStains } from "./translationCacheStains";

function hashSteps(steps: string[]) {
  return steps.join("|").toLowerCase();
}

export async function translateStainTips(
  tips: string[],
  locale: string,
  cacheKeyPrefix: string
) {
  // English → no translation needed
  if (locale === "en") return tips;

  const stepsHash = hashSteps(tips);
  const cacheKey = `${cacheKeyPrefix}_${locale}_${stepsHash}`;

  // 1) Check deduped cache
  const cached = translationCacheStains.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2) Translate each tip
  const translated = tips.map((tip) =>
    i18n.t("stainTips.dynamic", { tip })
  );

  // 3) Save deduped translation
  translationCacheStains.set(cacheKey, JSON.stringify(translated));

  return translated;
}