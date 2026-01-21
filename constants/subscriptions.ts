console.log("SUBSCRIPTIONS LOADED");
type SubscriptionTier = {
  features: string[];
  [key: string]: any;
};

export const SUBSCRIPTIONS: Record<"free" | "premium" | "pro", SubscriptionTier> = {
  free: {
    languages: ["en", "el", "es", "fr", "de", "it", "ru", "tr"],
    presetsLimit: 3,
    aiDailyLimit: 1,
    themes: ["light"],
    features: ["basicPrograms"],
  },

  premium: {
    priceMonthly: 2.49,
    priceYearly: 14.99,
    unlimitedPresets: true,
    aiUnlimited: true,
    scanDetect: true,
    themes: ["light", "dark", "gradient", "glass"],
    features: [
      "customFabrics",
      "customCycles",
      "offlineMode",
      "noAds",
    ],
  },

  pro: {
    priceMonthly: 4.99,
    priceYearly: 29.99,
    priceLifetime: 49.99,
    unlimitedPresets: true,
    aiUnlimited: true,
    scanDetect: true,
    batchScan: true,
    smartWardrobe: true,
    laundryPlanner: true,
    smartNotifications: true,
    aiFabricSafety: true,
    themes: ["all"],
    features: ["priorityAI"],
  },
} as const;