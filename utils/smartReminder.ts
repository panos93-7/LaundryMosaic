import * as Notifications from "expo-notifications";

const batchingMap: Record<string, number[]> = {};

function getDateKey(wash: any) {
  return `${wash.year}-${wash.month + 1}-${wash.day}`;
}

export async function scheduleSmartReminder(wash: any) {
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

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Laundry Reminder",
      body: `${wash.title} starts at ${wash.time}`,
      sound: "default",
    },
    trigger: {
      date: reminderDate,
      channelId: "default", // ⭐ ΑΠΑΡΑΙΤΗΤΟ ΓΙΑ ANDROID
    },
  });

  return id;
}

export async function cancelReminder(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id);
}
