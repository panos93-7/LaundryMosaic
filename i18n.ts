import * as Localization from "expo-localization";
import { I18n } from "i18n-js";

import de from "./locales/de.json"; // German
import el from "./locales/el.json"; // Greek
import en from "./locales/en.json"; // English
import es from "./locales/es.json"; // Spanish
import fr from "./locales/fr.json"; // French
import it from "./locales/it.json"; // Italian
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";
import ptBR from "./locales/pt-BR.json";
import ptPT from "./locales/pt-PT.json";
import ru from "./locales/ru.json"; // Russian
import tr from "./locales/tr.json"; // Turkish
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
  zhTW,
  ptPT,
  ptBR
};

// @ts-ignore
i18n.locale = (String(Localization.locale)).startsWith("el") ? "el" : "en";

export default i18n;