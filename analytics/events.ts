// analytics/events.ts
import { Analytics } from "./analytics";

export const Events = {
  // -----------------------------
  // APP + ONBOARDING
  // -----------------------------
  appOpened: () =>
    Analytics.track("app_opened"),

  onboardingCompleted: () =>
    Analytics.track("onboarding_completed"),

  // -----------------------------
  // SCREEN VIEW
  // -----------------------------
  screenView: (screen_name: string) =>
    Analytics.track("screen_view", { screen_name }),

  // -----------------------------
  // PAYWALL
  // -----------------------------
  paywallViewed: (paywall_type: string, source: string) =>
    Analytics.track("paywall_viewed", { paywall_type, source }),

  paywallDismissed: (paywall_type: string, cta: string) =>
    Analytics.track("paywall_dismissed", { paywall_type, cta }),

  // -----------------------------
  // PURCHASE FLOW
  // -----------------------------
  purchaseStarted: (
    product_id: string,
    price: number,
    currency: string,
    paywall_type: string
  ) =>
    Analytics.track("purchase_started", {
      product_id,
      price,
      currency,
      paywall_type,
    }),

  purchaseCompleted: (
    product_id: string,
    price: number,
    currency: string,
    tier: string
  ) =>
    Analytics.track("purchase_completed", {
      product_id,
      price,
      currency,
      tier,
    }),

  purchaseFailed: (reason: string) =>
    Analytics.track("purchase_failed", { reason }),

  // -----------------------------
  // FEATURE LOCKED / UNLOCKED
  // -----------------------------
  featureLockedTap: (feature: string, user_tier: string) =>
    Analytics.track("feature_locked_tap", { feature, user_tier }),

  featureUnlockedUsed: (feature: string, user_tier: string) =>
    Analytics.track("feature_unlocked_used", { feature, user_tier }),

  // ⭐ NEW — used in FeatureGrid
  featureUnlockedEntry: (feature: string, user_tier: string) =>
    Analytics.track("feature_unlocked_entry", { feature, user_tier }),

  // ⭐ NEW — used in FeatureGrid
  homeFeatureTap: (feature: string) =>
    Analytics.track("home_feature_tap", { feature }),

  // -----------------------------
  // AI SCAN
  // -----------------------------
  aiScanStarted: (mode: string) =>
    Analytics.track("ai_scan_started", { mode }),

  aiScanCompleted: (duration_ms: number, success: boolean) =>
    Analytics.track("ai_scan_completed", { duration_ms, success }),

  aiScanFailed: (error_type: string) =>
    Analytics.track("ai_scan_failed", { error_type }),

  // -----------------------------
  // SESSION EVENTS
  // -----------------------------
  sessionStart: (session_number: number, days_since_install: number) =>
    Analytics.track("session_start", {
      session_number,
      days_since_install,
    }),

  sessionFallbackTriggered: (session_number: number) =>
    Analytics.track("session_fallback_triggered", { session_number }),

  delayedFallbackTriggered: (hours_since_rejection: number) =>
    Analytics.track("delayed_fallback_triggered", {
      hours_since_rejection,
    }),
};