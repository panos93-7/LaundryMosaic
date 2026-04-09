import * as Localization from "expo-localization";
import * as Notifications from "expo-notifications";
import i18n from "../i18n";

const batchingMap: Record<string, number[]> = {};

function getDateKey(wash: any) {
  return `${wash.year}-${wash.month + 1}-${wash.day}`;
}

/**
 * ⭐ Επιλογή γλώσσας συσκευής με fallback σε English
 */
function resolveLanguage() {
  const locales = Localization.getLocales();

  if (!locales || locales.length === 0) {
    i18n.locale = "en";
    return;
  }

  const langCode = locales[0].languageCode;
  const region = locales[0].regionCode;

  let lang = langCode as string;

  if (langCode === "pt") {
    lang = region === "BR" ? "pt-BR" : "pt-PT";
  }

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
 * ⭐ Δημιουργία reminder (CLEAN VERSION)
 */
export async function scheduleSmartReminder(wash: any) {
  resolveLanguage();

  // 1. Parse time (UI already validated)
  const [hoursStr, minutesStr] = wash.time.split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);

  // 2. Build wash date in LOCAL timezone
  const washDate = new Date(
    wash.year,
    wash.month,
    wash.day,
    hours,
    minutes,
    0
  );

  const now = new Date();
  const diffMs = washDate.getTime() - now.getTime();
  const diffMinutes = diffMs / 1000 / 60;

  // 3. Smart reminder offset
  let reminderMinutesBefore = 30;
  if (diffMinutes > 180) reminderMinutesBefore = 60;
  if (diffMinutes < 60) reminderMinutesBefore = 10;
  if (diffMinutes < 20) reminderMinutesBefore = 5;

  let reminderDate = new Date(
    washDate.getTime() - reminderMinutesBefore * 60000
  );

  // 4. If reminder is in the past → skip silently
  if (reminderDate <= now) {
    console.log("⛔ Reminder in the past → skipping");
    return null;
  }

  // 5. Batching (avoid too many reminders close together)
  const key = getDateKey(wash);
  if (!batchingMap[key]) batchingMap[key] = [];

  const reminderMinutes = reminderDate.getHours() * 60 + reminderDate.getMinutes();

  const conflict = batchingMap[key].some(
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

  // 6. Multi-language title & body
  const title = i18n.t("reminder.title");
  const body = i18n.t("reminder.body", {
    washTitle: wash.title,
    washTime: wash.time
  });

  // 7. Schedule notification
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
      channelId: "default",
    },
  });

  console.log("📌 Reminder scheduled for:", reminderDate.toString());

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