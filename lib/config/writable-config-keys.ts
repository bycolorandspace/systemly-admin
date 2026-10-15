/**
 * The `system_config` keys this dashboard is allowed to write, and through which route.
 *
 * Added 2 October 2026 (main app: signal chart redesign plan, Phase 0, item 0.11). Until then
 * `/api/admin/toggle-config` and `/api/admin/set-config` upserted ANY key with ANY value. Both
 * sit behind the super-user check, so the risk was never a stranger: it was one request (a typo,
 * a stale tab, a script, a compromised admin session) writing a key nothing reads, or writing a
 * real key in the wrong shape. That matters most for `trade_execution`, the switch that lets the
 * main app place real orders: `set-config` could have written `{ "paused": false }` into it with
 * no card and no audit trail.
 *
 * So each route accepts only the keys a card on this dashboard writes through it, and anything
 * else is a 400. When you add a card, add its key here in the same change, or the card's save
 * will fail with "unknown key" (which is the point: you find out at once, not months later).
 *
 * Toggle keys hold the `{ paused, paused_at, paused_by }` shape the ToggleCard writes; value keys
 * hold a number or a string. A key is in exactly one list, so `set-config` can never write a
 * toggle's shape and `toggle-config` can never overwrite a number.
 *
 * Writers: `components/controls/toggle-card.tsx` and `components/overview/system-health-rail.tsx`
 * (toggles); `components/controls/number-config-card.tsx`, `text-config-card.tsx` and
 * `service-monitor.tsx` (values). Cards live on `app/controls/page.tsx` and `app/overview`.
 */

export const TOGGLE_CONFIG_KEYS: ReadonlySet<string> = new Set([
  // Trade execution kill switch (main app: getExecutionEnabled(), fail-closed). Off by default.
  "trade_execution",
  "signal_sharing",
  "test_trading",
  "community_signals",
  "new_scan_loading_ux",
  "scan_loading_split_panel",
  "new_scan_flow",
  "academy_roadmap",
  "scan_detail_v2",
  "signal_card_pay_reading",
  "academy_in_header",
  "risk_doctor_execute",
  "bounce_odds",
  // Chart-first signal page (main app: signal chart redesign, Phase 2, 2 October 2026).
  "signal_chart_view",
  // Markets home and the chart scan flow (main app: signal chart redesign, Phase 5, 2 October 2026).
  "markets_home",
  // The onboarding first signal as a Plus preview (main app: signal chart redesign, Phase 6,
  // 2 October 2026). Read by the server too: paused, the scan and chart routes lend nothing.
  "first_signal_chart_view",
  // User scans may say no trade (main app: signal chart redesign, Phase 3; strict, off by default).
  "user_scan_no_trade",
  // Rescan memory, threads and the hold-level alert (main app: signal chart redesign, Phase 4;
  // strict, seeded on).
  "signal_threads",
  "rescan_checkin",
  "hold_level_alerts",
  "news_gate",
  "community_feed",
  "telegram_community_signals",
  "stripe_reconcile_enforce",
  // Prepaid cards charged at checkout instead of trialing (main app:
  // getPrepaidTrialChargeEnabled(), strict, off by default). Decision log round 19, decision 2.
  "trial_prepaid_card_charge",
  "cancel_save_offer",
  "signal_stop_liquidity_veto",
  "whatsapp_require_verified_phone",
  // Weekend quotes removed from the candles the scan prompt reads (main app:
  // FEATURES.priceActionCalendarFilter). Decision log round 16, item 16.
  "price_action_calendar_filter",
  // Onboarding config (main app: onboarding paywall video and first signal, 15 October 2026).
  // `paused: false` means on; all three are seeded on.
  "onboarding_video_enabled",
  "onboarding_free_exit_visible",
  "onboarding_stop_out_followup_enabled",
]);

export const VALUE_CONFIG_KEYS: ReadonlySet<string> = new Set([
  "default_trial_days",
  // Which paid plans get the checkout trial (main app: getTrialTiers(), decision log round 19,
  // decision 2). Value checked by valueProblem() below.
  "trial_tiers",
  "share_expiry_hours",
  "signals_per_month_free",
  "signals_per_month_starter",
  "signals_per_month_plus",
  "signals_per_month_pro",
  "fair_use_daily_ceiling",
  "fair_use_monthly_ceiling",
  "public_price_credits_per_minute",
  "public_market_data_credits_per_minute",
  "public_price_per_ip_per_minute",
  "public_price_per_user_per_minute",
  "public_market_data_per_ip_per_minute",
  "public_market_data_per_user_per_minute",
  // Chart routes and the price slowdown (main app: signal chart redesign, Phase 1, 2 October 2026).
  "chart_candles_credits_per_minute",
  "chart_candles_per_ip_per_minute",
  "chart_candles_per_user_per_minute",
  "price_slow_after_markets",
  "price_slow_cache_seconds",
  // Reopen window and free verdicts a day (main app: signal chart redesign, Phase 3).
  "rescan_reopen_window_minutes",
  "free_verdicts_per_day",
  // Server trend check stage, off / record / decide (main app: release pack R.14). The main app
  // reads any other value as "record", so a typo can never switch deciding on.
  "user_scan_trend_check",
  "signal_max_age_hours_day",
  "signal_max_age_hours_swing",
  "signal_max_age_hours_scalp",
  "signal_max_age_hours_position",
  "signal_tp1_band_min_atr",
  "signal_tp1_band_max_atr",
  "email_sender_name",
  "email_sender_role",
  "email_code_step_live_from",
  "community_signal_symbols_starter",
  "community_whatsapp_daily_limit_starter",
  "community_signal_symbols_plus",
  "community_whatsapp_daily_limit_plus",
  "community_signal_symbols_pro",
  "community_whatsapp_daily_limit_pro",
  "signal_ai_model",
  "scan_now_ai_model",
  "strategy_cron_ai_model",
  "backtest_ai_model",
  "community_ai_model",
  "signal_alert_basis",
  "signal_alert_min_plan_quality",
  "signal_alert_min_confidence",
  // Onboarding config (15 October 2026). The two URLs are checked by valueProblem() below.
  "onboarding_video_url",
  "onboarding_video_poster_url",
  "onboarding_first_market_default",
  "onboarding_first_market_excluded",
]);

/**
 * Manual usage figures typed into the Costs page (`service-monitor.tsx`), one key per service:
 * `service_usage_manual_<service name, lower case, spaces to underscores>`. A pattern rather than
 * a list because the services come from `app/api/admin/service-usage`. Bounded to lower-case
 * letters, digits and underscores so it cannot name any other key.
 */
const MANUAL_USAGE_KEY = /^service_usage_manual_[a-z0-9_]{1,40}$/;

export function isWritableToggleKey(key: unknown): key is string {
  return typeof key === "string" && TOGGLE_CONFIG_KEYS.has(key);
}

export function isWritableValueKey(key: unknown): key is string {
  return (
    typeof key === "string" &&
    !TOGGLE_CONFIG_KEYS.has(key) &&
    (VALUE_CONFIG_KEYS.has(key) || MANUAL_USAGE_KEY.test(key))
  );
}

/** A market symbol id as the main app writes it: capitals and digits, e.g. XAUUSD, SPY. */
const SYMBOL_ID = /^[A-Z0-9]{2,12}$/;

/** The plans `trial_tiers` may name, matching the paid tiers in the main app's lib/stripe/trial-rules.ts. */
const TRIAL_TIER_NAMES = new Set(["starter", "plus", "pro"]);

/**
 * Why a value cannot be written to this key, or null when it can. Per-key checks for the keys
 * whose shape the main app depends on; every other value key accepts any number or text, as
 * before.
 *
 * `trial_tiers` (5 October 2026): a comma-separated list of starter, plus and pro, at least
 * one. The main app ignores unknown names and falls back to starter,plus on an empty list
 * (parseTrialTiers()), so a typo would silently put a plan back on the default; refusing it here
 * means the operator finds out at once.
 */
export function valueProblem(key: string, value: unknown): string | null {
  if (key === "trial_tiers") {
    if (typeof value !== "string") return "Trial plans must be text, e.g. starter,plus";
    const parts = value.split(",").map((s) => s.trim().toLowerCase());
    if (parts.length === 0 || parts.some((p) => !TRIAL_TIER_NAMES.has(p))) {
      return "Trial plans must be a comma-separated list of starter, plus and pro";
    }
  }
  if (key === "onboarding_video_url" || key === "onboarding_video_poster_url") {
    if (typeof value !== "string") return "The URL must be text";
    // A site-relative path ("/video/x.mp4", not "//host/x.mp4") or an https URL. Nothing else.
    const ok = /^\/(?!\/)\S*$/.test(value) || /^https:\/\/\S+$/.test(value);
    if (!ok) return "The URL must start with / (a path in the app) or https://";
  }
  if (key === "onboarding_first_market_default") {
    if (typeof value !== "string" || !SYMBOL_ID.test(value.trim())) {
      return "Use one symbol id in capitals, e.g. XAUUSD";
    }
  }
  if (key === "onboarding_first_market_excluded") {
    if (typeof value !== "string") return "Use comma-separated symbol ids, e.g. SPY,QQQ";
    const parts = value.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.some((p) => !SYMBOL_ID.test(p))) {
      return "Use comma-separated symbol ids in capitals, e.g. SPY,QQQ";
    }
  }
  return null;
}
