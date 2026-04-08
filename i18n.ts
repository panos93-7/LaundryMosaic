import * as Localization from "expo-localization";
import { I18n } from "i18n-js";

import de from "./locales/de.json";
import el from "./locales/el.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import it from "./locales/it.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";
import ptBR from "./locales/pt-BR.json";
import ptPT from "./locales/pt-PT.json";
import ru from "./locales/ru.json";
import tr from "./locales/tr.json";
import zhTW from "./locales/zh-TW.json";

const i18n = new I18n();

i18n.enableFallback = true;

i18n.translations = {
  en,
  el,
  es,
  fr,
  de,
  it,
  tr,
  ru,
  ja,
  ko,
  "zh-TW": zhTW,
  "pt-PT": ptPT,
  "pt-BR": ptBR
};

// ⭐ SAFE locale detection (χωρίς να αλλάζει τίποτα στο app)
const locales = Localization.getLocales();

// languageCode μπορεί να είναι undefined, αλλά ΠΟΤΕ null → TypeScript fix
const langCode: string = locales[0]?.languageCode || "en";
const region: string = locales[0]?.regionCode || "US";

// ΠΑΝΤΑ string
let locale: string = langCode;

// Portuguese split
if (langCode === "pt") {
  locale = region === "BR" ? "pt-BR" : "pt-PT";
}

// Chinese Traditional
if (langCode === "zh") {
  locale = "zh-TW";
}

i18n.locale = locale;

// ⭐ Allow manual language switching
export const setAppLanguage = (lang: string) => {
  i18n.locale = lang;
};

export default i18n;