import * as Localization from "expo-localization";
import * as Notifications from "expo-notifications";
import i18n from "../i18n";

const batchingMap: Record<string, number[]> = {};

function getDateKey(wash: any) {
  return `${wash.year}-${wash.month + 1}-${wash.day}`;
}

/**
 * ⭐ Επιλογή γλώσσας συσκευής με fallback σε English
 * Συμβατό με Expo SDK 49/50/51
 */
function resolveLanguage() {
  const locales = Localization.getLocales();

  if (!locales || locales.length === 0) {
    i18n.locale = "en";
    return;
  }

  const langCode = locales[0].languageCode;   // π.χ. "en", "el", "pt"
  const region = locales[0].regionCode;       // π.χ. "BR", "PT"

  // ⭐ ΠΑΝΤΑ string — ποτέ null
  let lang = langCode as string;

  // Portuguese split
  if (langCode === "pt") {
    lang = region === "BR" ? "pt-BR" : "pt-PT";
  }

  // Chinese Traditional
  if (langCode === "zh") {
    lang = "zh-TW";
  }

  const supported = [
    "en", "el", "de", "es", "fr", "it", "ja",
    "ko", "pt-BR", "pt-PT", "ru", "tr", "zh-TW"
  ];

  if (!supported.includes(lang)) {
    lang = "en";
  }

  i18n.locale = lang;
}

/**
 * ⭐ Δημιουργία reminder
 */
export async function scheduleSmartReminder(wash: any) {
  resolveLanguage();

  const washDate = new Date(wash.year, wash.month, wash.day);
  const [hours, minutes] = wash.time.split(":").map(Number);
  washDate.setHours(hours);
  washDate.setMinutes(minutes);

  const now = new Date();
  const diffMs = washDate.getTime() - now.getTime();
  const diffMinutes = diffMs / 1000 / 60;

  let reminderMinutesBefore = 30;
  if (diffMinutes > 180) reminderMinutesBefore = 60;
  if (diffMinutes < 60) reminderMinutesBefore = 10;
  if (diffMinutes < 20) reminderMinutesBefore = 5;

  let reminderDate = new Date(
    washDate.getTime() - reminderMinutesBefore * 60000
  );

  if (reminderDate <= now) return null;

  const key = getDateKey(wash);
  if (!batchingMap[key]) batchingMap[key] = [];

  const existing = batchingMap[key];
  const reminderMinutes = reminderDate.getHours() * 60 + reminderDate.getMinutes();

  const conflict = existing.some(
    (t) => Math.abs(t - reminderMinutes) < 10
  );

  if (conflict) {
    const shifted = reminderMinutes + 12;
    const shiftedDate = new Date(reminderDate);
    shiftedDate.setHours(Math.floor(shifted / 60));
    shiftedDate.setMinutes(shifted % 60);
    reminderDate = shiftedDate;
  }

  batchingMap[key].push(
    reminderDate.getHours() * 60 + reminderDate.getMinutes()
  );

  // ⭐ MULTI-LANGUAGE TITLE & BODY
  const title = i18n.t("reminder.title");
  const body = i18n.t("reminder.body", {
    washTitle: wash.title,
    washTime: wash.time
  });

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: "default",
    },
    trigger: {
      date: reminderDate,
      channelId: "default",
    },
  });

  return id;
}

/**
 * ⭐ Ακύρωση reminder
 */
export async function cancelReminder(id: string | null) {
  if (!id) return;
  await Notifications.cancelScheduledNotificationAsync(id);
}

/**
 * ⭐ UPDATE reminder (cancel + reschedule)
 */
export async function updateSmartReminder(oldId: string | null, wash: any) {
  await cancelReminder(oldId);
  const newId = await scheduleSmartReminder(wash);
  return newId;
}