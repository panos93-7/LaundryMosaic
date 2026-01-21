import AsyncStorage from "@react-native-async-storage/async-storage";

/* -------------------------------------------------------
   PREMIUM REJECTION (delayed fallback)
------------------------------------------------------- */

export async function markPremiumRejected() {
  try {
    await AsyncStorage.setItem("hasRejectedPremium", "true");
    await AsyncStorage.setItem(
      "premiumRejectionTimestamp",
      Date.now().toString()
    );
  } catch (err) {
    console.log("markPremiumRejected error:", err);
  }
}

export async function getPremiumRejectionInfo() {
  try {
    const rejected = await AsyncStorage.getItem("hasRejectedPremium");
    const timestamp = await AsyncStorage.getItem("premiumRejectionTimestamp");

    return {
      rejected: rejected === "true",
      timestamp: timestamp ? Number(timestamp) : 0,
    };
  } catch (err) {
    console.log("getPremiumRejectionInfo error:", err);
    return { rejected: false, timestamp: 0 };
  }
}

/* -------------------------------------------------------
   SESSION TRACKING
------------------------------------------------------- */

export async function incrementSessions() {
  try {
    const current = await AsyncStorage.getItem("appSessions");
    const next = current ? Number(current) + 1 : 1;

    await AsyncStorage.setItem("appSessions", next.toString());
    return next;
  } catch (err) {
    console.log("incrementSessions error:", err);
    return 1;
  }
}

export async function getSessionNumber() {
  try {
    const s = await AsyncStorage.getItem("appSessions");
    return s ? Number(s) : 1;
  } catch (err) {
    console.log("getSessionNumber error:", err);
    return 1;
  }
}

/* -------------------------------------------------------
   INSTALL DATE (analytics: days_since_install)
------------------------------------------------------- */

export async function initInstallDate() {
  try {
    const existing = await AsyncStorage.getItem("install_date");
    if (!existing) {
      await AsyncStorage.setItem("install_date", Date.now().toString());
    }
  } catch (err) {
    console.log("initInstallDate error:", err);
  }
}

export async function getDaysSinceInstall() {
  try {
    const stored = await AsyncStorage.getItem("install_date");
    if (!stored) return 0;

    const installDate = Number(stored);
    const now = Date.now();

    const diff = now - installDate;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  } catch (err) {
    console.log("getDaysSinceInstall error:", err);
    return 0;
  }
}

/* -------------------------------------------------------
   PREMIUM FALLBACK LOGIC
------------------------------------------------------- */

export async function shouldShowPremiumFallback() {
  try {
    const { rejected, timestamp } = await getPremiumRejectionInfo();
    const sessions = await getSessionNumber();

    if (!rejected) return false;

    const hoursSinceRejection =
      (Date.now() - timestamp) / (1000 * 60 * 60);

    // Delayed fallback (24 hours)
    if (hoursSinceRejection >= 24) return true;

    // Session fallback (3 sessions)
    if (sessions >= 3) return true;

    return false;
  } catch (err) {
    console.log("shouldShowPremiumFallback error:", err);
    return false;
  }
}