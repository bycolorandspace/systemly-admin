import { createAdminClient } from "@/lib/supabase";
import { getSystemHealth } from "@/lib/queries/overview";
import { ToggleCard } from "@/components/controls/toggle-card";
import { NumberConfigCard } from "@/components/controls/number-config-card";
import { TextConfigCard } from "@/components/controls/text-config-card";
import { CronTriggerList } from "@/components/controls/cron-trigger-card";
import { Header } from "@/components/layout/header";

export const revalidate = 30;

export default async function ControlsPage() {
  const supabase = createAdminClient();
  const health = await getSystemHealth(supabase);

  const { data: allConfigs } = await supabase
    .from("system_config")
    .select("key, value, updated_at")
    .order("key");

  const configMap = Object.fromEntries(
    (allConfigs ?? []).map((c) => [c.key, c.value]),
  );
  const defaultTrialDays = Number(
    (configMap["default_trial_days"] as number | undefined) ?? 7,
  );
  // Default on, matching CANCEL_SAVE_OFFER_DEFAULT in the main app.
  const cancelSaveOfferPaused =
    (configMap["cancel_save_offer"] as { paused?: boolean } | undefined)?.paused ?? false;
  // Off (paused) by default, matching getStripeReconcileEnforce() in the main
  // app's lib/system-config.ts: no row means report only.
  const stripeReconcileEnforcePaused =
    (configMap["stripe_reconcile_enforce"] as { paused?: boolean } | undefined)?.paused ?? true;
  // Off (paused) by default, matching WHATSAPP_REQUIRE_VERIFIED_PHONE_DEFAULT
  // in the main app's config/whatsapp.ts: no row means any number on file.
  const whatsappRequireVerifiedPaused =
    (configMap["whatsapp_require_verified_phone"] as { paused?: boolean } | undefined)?.paused ?? true;
  const shareExpiryHours = Number(
    (configMap["share_expiry_hours"] as number | undefined) ?? 168,
  );
  const emailSenderName = String(
    (configMap["email_sender_name"] as string | undefined) ?? "Joshua",
  );
  const emailSenderRole = String(
    (configMap["email_sender_role"] as string | undefined) ?? "Community Manager",
  );
  // Unset means the email code step is not live yet. Read by
  // getEmailCodeStepLiveFrom() in the main app's lib/system-config.ts, which
  // also accepts { from } like the age gate.
  const emailCodeStepLiveFromRaw = configMap["email_code_step_live_from"] as
    | string
    | { from?: string }
    | undefined;
  const emailCodeStepLiveFrom =
    typeof emailCodeStepLiveFromRaw === "string"
      ? emailCodeStepLiveFromRaw
      : (emailCodeStepLiveFromRaw?.from ?? "");

  // Community notifications config (fallback defaults match config/tiers.ts)
  const communitySymbolsStarter = String(
    (configMap["community_signal_symbols_starter"] as string | undefined) ?? "XAU/USD",
  );
  const communitySymbolsPlus = String(
    (configMap["community_signal_symbols_plus"] as string | undefined) ?? "all",
  );
  const communitySymbolsPro = String(
    (configMap["community_signal_symbols_pro"] as string | undefined) ?? "all",
  );
  const communityLimitStarter = Number(
    (configMap["community_whatsapp_daily_limit_starter"] as number | undefined) ?? 1,
  );
  const communityLimitPlus = Number(
    (configMap["community_whatsapp_daily_limit_plus"] as number | undefined) ?? 3,
  );
  const communityLimitPro = Number(
    (configMap["community_whatsapp_daily_limit_pro"] as number | undefined) ?? 5,
  );

  // Per-tier signal allowances. Fallbacks match TIER_CONFIG in the main app's
  // config/tiers.ts. -1 means unlimited, which is how Pro ships.
  const signalsFree = Number(
    (configMap["signals_per_month_free"] as number | undefined) ?? 2,
  );
  const signalsStarter = Number(
    (configMap["signals_per_month_starter"] as number | undefined) ?? 6,
  );
  const signalsPlus = Number(
    (configMap["signals_per_month_plus"] as number | undefined) ?? 60,
  );
  const signalsPro = Number(
    (configMap["signals_per_month_pro"] as number | undefined) ?? -1,
  );

  // Fair use ceilings behind any unlimited allowance. Fallbacks match
  // FAIR_USE_DAILY_CEILING and FAIR_USE_MONTHLY_CEILING in the main app's
  // config/fair-use.ts. The main app ignores anything below 1 and uses the
  // fallback instead, so a ceiling cannot be switched off from here.
  const fairUsePerDay = Number(
    (configMap["fair_use_daily_ceiling"] as number | undefined) ?? 40,
  );
  const fairUsePerMonth = Number(
    (configMap["fair_use_monthly_ceiling"] as number | undefined) ?? 400,
  );

  // Public market data limits on /api/price and /api/market-data. Fallbacks
  // match config/public-market-data.ts in the main app. The main app bounds
  // these when it reads them (helpers/public-market-limits.ts), whatever is
  // saved here: below 1 is ignored, per-caller limits are capped at 1000, each
  // budget at 34, and the two budgets together at 35 of the 55-credit Twelve
  // Data plan, so scans always keep 20. The card min and max are only hints.
  const publicPricePerIp = Number(
    (configMap["public_price_per_ip_per_minute"] as number | undefined) ?? 120,
  );
  const publicPricePerUser = Number(
    (configMap["public_price_per_user_per_minute"] as number | undefined) ?? 60,
  );
  const publicMarketDataPerIp = Number(
    (configMap["public_market_data_per_ip_per_minute"] as number | undefined) ?? 20,
  );
  const publicMarketDataPerUser = Number(
    (configMap["public_market_data_per_user_per_minute"] as number | undefined) ?? 20,
  );
  const publicPriceCredits = Number(
    (configMap["public_price_credits_per_minute"] as number | undefined) ?? 20,
  );
  const publicMarketDataCredits = Number(
    (configMap["public_market_data_credits_per_minute"] as number | undefined) ?? 8,
  );

  // Exit placement. Fallbacks match MAX_AGE_HOURS_BY_STYLE and
  // TP1_BAND_ATR_BY_STYLE in the main app's config/trading-horizons.ts. The
  // horizon caps were cut hard on 2026-09-11 on the evidence in
  // docs/analysis/STOP_AND_TARGET_PLACEMENT_STUDY.md, so these are the dials
  // most likely to need moving back if the shorter clock proves too blunt.
  const maxAgeScalp = Number(
    (configMap["signal_max_age_hours_scalp"] as number | undefined) ?? 8,
  );
  const maxAgeDay = Number(
    (configMap["signal_max_age_hours_day"] as number | undefined) ?? 12,
  );
  const maxAgeSwing = Number(
    (configMap["signal_max_age_hours_swing"] as number | undefined) ?? 36,
  );
  const maxAgePosition = Number(
    (configMap["signal_max_age_hours_position"] as number | undefined) ?? 336,
  );
  const tp1BandMin = Number(
    (configMap["signal_tp1_band_min_atr"] as number | undefined) ?? 0.6,
  );
  const tp1BandMax = Number(
    (configMap["signal_tp1_band_max_atr"] as number | undefined) ?? 1.2,
  );
  const stopVetoPaused =
    (configMap["signal_stop_liquidity_veto"] as { paused?: boolean } | undefined)
      ?.paused === true;

  // Signal engine (fallbacks match config/ai-models.ts and
  // config/strategy-scanning.ts in the main app)
  const communityAiModel = String(
    (configMap["community_ai_model"] as string | undefined) ?? "deepseek",
  );
  const signalAiModel = String(
    (configMap["signal_ai_model"] as string | undefined) ?? "claude",
  );
  const scanNowAiModel = String(
    (configMap["scan_now_ai_model"] as string | undefined) ?? "deepseek",
  );
  const strategyCronAiModel = String(
    (configMap["strategy_cron_ai_model"] as string | undefined) ?? "deepseek",
  );
  const backtestAiModel = String(
    (configMap["backtest_ai_model"] as string | undefined) ?? "deepseek",
  );
  const signalAlertMinConfidence = Number(
    (configMap["signal_alert_min_confidence"] as number | undefined) ?? 60,
  );
  // Alerts moved from confidence to plan quality on 2026-09-14. Fallbacks
  // match SIGNAL_ALERT_MIN_PLAN_QUALITY and SIGNAL_ALERT_BASIS_DEFAULT in the
  // main app's config/strategy-scanning.ts.
  const signalAlertMinPlanQuality = Number(
    (configMap["signal_alert_min_plan_quality"] as number | undefined) ?? 60,
  );
  const signalAlertBasis = String(
    (configMap["signal_alert_basis"] as string | undefined) ?? "plan_quality",
  );

  return (
    <>
      <Header title="Controls" />
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-10">
          {/* System toggles */}
          <section>
            <p
              className="text-[10px] tracking-widest uppercase mb-4"
              style={{ color: "var(--muted-foreground)" }}
            >
              System Controls
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ToggleCard
                label="Signal Sharing"
                description="Pausing blocks all shared signal link access (returns 503 to viewers)"
                paused={health.signalSharingPaused}
                configKey="signal_sharing"
              />
              <ToggleCard
                label="Test Trading"
                description="Pausing stops automated test signal generation and execution"
                paused={health.testTradingPaused}
                configKey="test_trading"
              />
              <ToggleCard
                label="Community Signals"
                description="Runs AI analysis on 15 symbols 4× daily (weekdays, 30 min before the London and NY opens). Cost depends on the provider set below."
                paused={health.communitySignalsPaused}
                configKey="community_signals"
              />
              <ToggleCard
                label="New Scan Loading UX"
                description="Switches every user to the rebuilt scan loading screen and the phase 2 explanation skeletons. Testers can preview it per browser with ?ff:newScanLoadingUx=on without turning it on here. Takes up to 60s to take effect."
                paused={health.newScanLoadingUxPaused}
                configKey="new_scan_loading_ux"
              />
              <ToggleCard
                label="Scan Loading: Split Panel"
                description="Only applies when New Scan Loading UX is on. Off uses the page-shaped skeleton, on uses the progress rail beside a preview. A comparison switch, not a rollout one."
                paused={health.scanLoadingSplitPanelPaused}
                configKey="scan_loading_split_panel"
              />
              <ToggleCard
                label="New Signal Flow"
                description="Switches /signals/new to the rebuilt one-screen flow and adds the first-signal step at the end of onboarding. Off keeps the current four-step form and ends onboarding on /signals/new. Testers can preview it per browser with ?ff:newScanFlow=on without turning it on here. Takes up to 60s to take effect."
                paused={health.newScanFlowPaused}
                configKey="new_scan_flow"
              />
              <ToggleCard
                label="Academy Course Saving"
                description="Whether onboarding saves a few Academy courses into a new user's favourites, picked from their 'what trips you up most' answer. It happens silently on the last screen of the goals questions; there is no longer a step that shows them. LIVE by default, unlike the flags above: this is a kill switch for when the academy database is unreachable, not a rollout. Off skips that one write and changes nothing the user sees. Takes up to 60s to take effect."
                paused={health.academyRoadmapPaused}
                configKey="academy_roadmap"
              />
              <ToggleCard
                label="Rebuilt Scan Page"
                description="The redesigned scan detail page: money first trade panel with the price wire, trend alignment and copy at the top, every level grouped under the entry, stop and targets, and warnings at the bottom. LIVE by default. Pausing it brings back the previous layout exactly as it was. Testers can compare per browser with ?ff:scanDetailV2=off. Takes up to 60s to take effect."
                paused={health.scanDetailV2Paused}
                configKey="scan_detail_v2"
              />
              <ToggleCard
                label="Signal Cards: Pay Reading"
                description="Signal cards show what the first target would make against the reader's risk, and a count of how many chart readings agree with the trade, instead of the AI confidence percentage. Both are worked out in code when the signal is saved. LIVE by default. Pausing it restores the confidence percentage exactly. Testers can compare per browser with ?ff:signalCardPayReading=off. Takes up to 60s to take effect."
                paused={health.signalCardPayReadingPaused}
                configKey="signal_card_pay_reading"
              />
              <ToggleCard
                label="Academy Progress in Header"
                description="Moves the Academy card (level, XP bar, streak, achievements) out of the sidebar footer and into the dashboard header as a small pill, to free up sidebar space. Hovering the pill shows the full card. Screens 1024px and wider only; narrower screens keep it in the sidebar. LIVE by default. Pausing it puts the card back in the sidebar footer. Testers can compare per browser with ?ff:academyInHeader=off. Takes up to 60s to take effect."
                paused={health.academyInHeaderPaused}
                configKey="academy_in_header"
              />
              <ToggleCard
                label="Risk Doctor: Execute"
                description="Whether Risk Doctor's Execute button can place trades with the user's broker. LIVE by default. Pausing it stops everyone except super users placing trades from Risk Doctor, and the button reads 'Execute is paused'. The calculator stays on either way. Takes up to 60s to take effect."
                paused={health.riskDoctorExecutePaused}
                configKey="risk_doctor_execute"
              />
              <ToggleCard
                label="Signal Page: Bounce Odds"
                description="On the signal page, every level between the entry and a target says to look out for price turning back there, with measured odds where a pattern covers it, and the trade panel says 'bounce likely' once a 15-minute candle touches such a level and closes back from it. Touches are recorded by the outcome check either way. LIVE by default. Pausing it puts the plain look-out lines back and hides the note. Testers can compare per browser with ?ff:bounceOdds=off. Takes up to 60s to take effect."
                paused={health.bounceOddsPaused}
                configKey="bounce_odds"
              />
              <ToggleCard
                label="News Gate"
                description="Automatic strategy and community scans skip a market when a major scheduled release (US jobs report, US inflation, or a rate decision by the Fed, ECB, BoE, BoJ, BoC, RBA, RBNZ or SNB) lands during the trade, and users' own scans carry a news-day warning instead. LIVE by default. Pausing it stops both: every market is scanned and no new warnings are written. The weekly calendar fetch keeps running either way. Takes up to 60s to take effect."
                paused={health.newsGatePaused}
                configKey="news_gate"
              />
              <ToggleCard
                label="Community Feed"
                description="Shows the /feed page and Share-to-Feed buttons. No AI credits — display only."
                paused={health.communityFeedPaused}
                configKey="community_feed"
              />
              <ToggleCard
                label="Telegram Broadcast"
                description="Posts each batch of community signals to the Telegram channel. Needs TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID — verify with /api/debug/telegram-health first."
                paused={health.telegramCommunityPaused}
                configKey="telegram_community_signals"
              />
            </div>
          </section>

          {/* Growth controls */}
          <section>
            <p
              className="text-[10px] tracking-widest uppercase mb-4"
              style={{ color: "var(--muted-foreground)" }}
            >
              Growth Controls
            </p>
            <div className="space-y-3">
              <NumberConfigCard
                label="Default Trial Length"
                description="Days granted via Stripe trial at checkout. Main app reads this live and words every CTA from it: 7 reads as 'Start 7 day access', 2 or fewer as '48 hour'. The landing site keeps its own copy in systemly-landing lib/trial.ts; change both together."
                configKey="default_trial_days"
                initialValue={defaultTrialDays}
                min={0}
                max={365}
                unit="days"
              />
              <ToggleCard
                label="Billing Reconcile: Correct Plans"
                description="Every morning the feed health email compares every Stripe subscription with the plan on the account, using the same rule as the webhooks. PAUSED (the default) only reports what it finds. LIVE also corrects each account that does not match Stripe, up to 25 a day; an admin grant is never lowered. Switch it on after a week of reports you agree with."
                paused={stripeReconcileEnforcePaused}
                configKey="stripe_reconcile_enforce"
              />
              <ToggleCard
                label="Cancel Flow: Free Month of Plus"
                description="Offers one free month of Plus to eligible people who give a reason for cancelling in Settings > Billing. Once per account. Nobody sees it until STRIPE_CANCEL_SAVE_COUPON_ID is set in the main app."
                paused={cancelSaveOfferPaused}
                configKey="cancel_save_offer"
              />
              <NumberConfigCard
                label="Share Link Expiry"
                description="How long shared signal links stay active before expiring"
                configKey="share_expiry_hours"
                initialValue={shareExpiryHours}
                min={1}
                unit="hours"
              />
            </div>
          </section>

          {/* Tier quotas */}
          <section>
            <p
              className="text-[10px] tracking-widest uppercase mb-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              Tier Quotas
            </p>
            <p
              className="text-xs mb-4"
              style={{ color: "var(--muted-foreground)" }}
            >
              On-demand signals each plan gets per calendar month. The main app
              reads these live, so a change here takes effect within a minute
              with no redeploy. Enter <code>-1</code> for unlimited. Every
              surface that quotes the number reads it from here, including the
              usage bar, the warning banner and the wall.
            </p>
            <div className="space-y-3">
              <NumberConfigCard
                label="Signals / month (Free)"
                description="Default: 2, at most 1 a day. The guided first signal in onboarding is extra and never counts, so a new free account gets 3 in its first month."
                configKey="signals_per_month_free"
                initialValue={signalsFree}
                min={-1}
                max={10000}
                unit="/ month"
              />
              <NumberConfigCard
                label="Signals / month (Starter)"
                description="Default: 6, at most 1 a day."
                configKey="signals_per_month_starter"
                initialValue={signalsStarter}
                min={-1}
                max={10000}
                unit="/ month"
              />
              <NumberConfigCard
                label="Signals / month (Plus)"
                description="Default: 60, shown to users as up to 2 a day."
                configKey="signals_per_month_plus"
                initialValue={signalsPlus}
                min={-1}
                max={10000}
                unit="/ month"
              />
              <NumberConfigCard
                label="Signals / month (Pro)"
                description="Default: -1, meaning unlimited."
                configKey="signals_per_month_pro"
                initialValue={signalsPro}
                min={-1}
                max={10000}
                unit="/ month"
              />
              <NumberConfigCard
                label="Fair use ceiling / day"
                description="Default: 40. The most signals or opportunity scans any unlimited allowance can run in one UTC day. Applies to whichever plan is unlimited, not only Pro. Reaching it pauses the account until midnight UTC and emails the internal inbox once."
                configKey="fair_use_daily_ceiling"
                initialValue={fairUsePerDay}
                min={1}
                max={10000}
                unit="/ day"
              />
              <NumberConfigCard
                label="Fair use ceiling / month"
                description="Default: 400. The same ceiling per calendar month. The busiest real month to 29 September 2026 was 170. Values below 1 are ignored and the default applies."
                configKey="fair_use_monthly_ceiling"
                initialValue={fairUsePerMonth}
                min={1}
                max={100000}
                unit="/ month"
              />
            </div>
          </section>

          {/* Public market data */}
          <section>
            <p
              className="text-[10px] tracking-widest uppercase mb-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              Public Market Data
            </p>
            <p
              className="text-xs mb-4"
              style={{ color: "var(--muted-foreground)" }}
            >
              Limits on the two public price routes, /api/price (live trade
              panels) and /api/market-data (candles for the mobile apps). Live
              within a minute, no redeploy. The two budgets share the 55-credit
              Twelve Data plan with scans: together they are held to 35 a
              minute so scans always keep 20. If the two add up to more, the
              price budget is kept and the market data budget is lowered to
              fit. Values below 1 are ignored and the default applies.
            </p>
            <div className="space-y-3">
              <NumberConfigCard
                label="Price budget (all callers)"
                description="Default: 20. Twelve Data credits /api/price may spend per minute across everyone. One market watched continuously costs at most 12. When spent, polls get a 503 and panels keep their last price. At most 34."
                configKey="public_price_credits_per_minute"
                initialValue={publicPriceCredits}
                min={1}
                max={34}
                unit="credits / min"
              />
              <NumberConfigCard
                label="Market data budget (all callers)"
                description="Default: 8. Twelve Data credits /api/market-data may spend per minute across everyone; one chart load costs 3 or 4. Nothing calls it yet. Lowered automatically if price plus this exceeds 35."
                configKey="public_market_data_credits_per_minute"
                initialValue={publicMarketDataCredits}
                min={1}
                max={34}
                unit="credits / min"
              />
              <NumberConfigCard
                label="Price requests per address"
                description="Default: 120, ten people on one address watching a live trade. Every web viewer is counted here. Guards our invocation cost, not the Twelve Data plan. At most 1000."
                configKey="public_price_per_ip_per_minute"
                initialValue={publicPricePerIp}
                min={1}
                max={1000}
                unit="/ min"
              />
              <NumberConfigCard
                label="Price requests per account"
                description="Default: 60, five app screens polling every five seconds. Callers with a Bearer token. Their address ceiling is ten times this. At most 1000."
                configKey="public_price_per_user_per_minute"
                initialValue={publicPricePerUser}
                min={1}
                max={1000}
                unit="/ min"
              />
              <NumberConfigCard
                label="Market data requests per address"
                description="Default: 20, a new chart every three seconds. At most 1000."
                configKey="public_market_data_per_ip_per_minute"
                initialValue={publicMarketDataPerIp}
                min={1}
                max={1000}
                unit="/ min"
              />
              <NumberConfigCard
                label="Market data requests per account"
                description="Default: 20. Callers with a Bearer token. Their address ceiling is ten times this. At most 1000."
                configKey="public_market_data_per_user_per_minute"
                initialValue={publicMarketDataPerUser}
                min={1}
                max={1000}
                unit="/ min"
              />
            </div>
          </section>

          {/* Exit placement */}
          <section>
            <p
              className="text-[10px] tracking-widest uppercase mb-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              Exit Placement
            </p>
            <p
              className="text-xs mb-4"
              style={{ color: "var(--muted-foreground)" }}
            >
              Where a trade&apos;s first target sits and how long the setup
              stays live. The main app reads these within a minute, with no
              redeploy. Changing them changes prices users trade on, so move one
              dial at a time and watch the next day of outcomes. Evidence for
              the shipped values is in the exit placement studies under
              docs/analysis.
            </p>
            <div className="space-y-3">
              <NumberConfigCard
                label="Max age (Day)"
                description="Default: 12 hours, cut from 24. A day signal is in front for about five hours and is nearly a full ATR behind by hour 24."
                configKey="signal_max_age_hours_day"
                initialValue={maxAgeDay}
                min={1}
                max={336}
                unit="hours"
              />
              <NumberConfigCard
                label="Max age (Swing)"
                description="Default: 36 hours, cut from 168. Worth +0.11R in sample and +0.29R out of sample, on 13 of 15 symbols. The single largest improvement found."
                configKey="signal_max_age_hours_swing"
                initialValue={maxAgeSwing}
                min={1}
                max={336}
                unit="hours"
              />
              <NumberConfigCard
                label="Max age (Scalp)"
                description="Default: 8 hours, unchanged. Only 8 scalp signals in the study sample, so this one is untested rather than confirmed."
                configKey="signal_max_age_hours_scalp"
                initialValue={maxAgeScalp}
                min={1}
                max={336}
                unit="hours"
              />
              <NumberConfigCard
                label="Max age (Position)"
                description="Default: 336 hours, unchanged and equal to the absolute cap. No position signals in the study sample."
                configKey="signal_max_age_hours_position"
                initialValue={maxAgePosition}
                min={1}
                max={336}
                unit="hours"
              />
              <NumberConfigCard
                label="First target band, floor"
                description="Default: 0.6. The nearest the first target may sit, in multiples of the symbol's ATR. One pair for every style: the evidence separates swing from day weakly at best."
                configKey="signal_tp1_band_min_atr"
                initialValue={tp1BandMin}
                min={0.1}
                max={6}
                step={0.05}
                unit="× ATR"
              />
              <NumberConfigCard
                label="First target band, ceiling"
                description="Default: 1.2. Expectancy falls off sharply past 1.5× ATR at every stop width, in both halves of the sample. The realised median before this change was 1.69×."
                configKey="signal_tp1_band_max_atr"
                initialValue={tp1BandMax}
                min={0.1}
                max={6}
                step={0.05}
                unit="× ATR"
              />
              <ToggleCard
                label="Stop liquidity veto"
                description="Moves a stop that has landed within 0.1× ATR of an obvious level past that level. A stop anchored to a level is where other people's stops are, and price goes there to collect them. Pause to place stops purely on volatility."
                paused={stopVetoPaused}
                configKey="signal_stop_liquidity_veto"
              />
            </div>
          </section>

          {/* Email sender */}
          <section>
            <p
              className="text-[10px] tracking-widest uppercase mb-4"
              style={{ color: "var(--muted-foreground)" }}
            >
              Email
            </p>
            <div className="space-y-3">
              <TextConfigCard
                label="Sender Name"
                description="Name shown in welcome and transactional emails"
                configKey="email_sender_name"
                initialValue={emailSenderName}
                placeholder="e.g. Joshua"
              />
              <TextConfigCard
                label="Sender Role"
                description="Role shown under the sender name in the email sign-off"
                configKey="email_sender_role"
                initialValue={emailSenderRole}
                placeholder="e.g. Community Manager"
              />
              <TextConfigCard
                label="Email code step live from"
                description="The one switch for email confirmation. Set an ISO time and, from that moment, password sign-ups are offered the code step after the plan step, Settings shows the Email confirmation card, and invited friends get one reminder; promotional email also skips unconfirmed accounts created after it, and referrals whose friend never confirms are written off 30 days after it. A future time schedules it. Clear it to switch all of that off. See config/email-verification.ts in the main app."
                configKey="email_code_step_live_from"
                initialValue={emailCodeStepLiveFrom}
                placeholder="e.g. 2026-10-06T09:00:00Z"
              />
            </div>
          </section>

          {/* Community notifications */}
          <section>
            <p
              className="text-[10px] tracking-widest uppercase mb-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              Community Notifications
            </p>
            <p
              className="text-xs mb-4"
              style={{ color: "var(--muted-foreground)" }}
            >
              Controls which symbols each tier receives in community WhatsApp digests and how many digests per day.
              Symbols: comma-separated (e.g. <code>XAU/USD,GBP/USD</code>) or <code>all</code>.
              Changes take effect on the next cron run — no redeploy needed.
            </p>
            <div className="space-y-3">
              <ToggleCard
                label="WhatsApp: Verified Numbers Only"
                description="LIVE sends WhatsApp alerts only to numbers the user has verified. PAUSED (the default) sends to any number on file, as before 30 September 2026. There is no phone verification flow yet, so switching this on today stops every WhatsApp alert. Switch it on the day that flow ships. Read once per scan or cron run, no redeploy."
                paused={whatsappRequireVerifiedPaused}
                configKey="whatsapp_require_verified_phone"
              />
              <p className="text-[10px] tracking-widest uppercase pt-1" style={{ color: "var(--muted-foreground)" }}>Starter</p>
              <TextConfigCard
                label="Symbols (Starter)"
                description="Comma-separated symbols or 'all'. Default: XAU/USD"
                configKey="community_signal_symbols_starter"
                initialValue={communitySymbolsStarter}
                placeholder="e.g. XAU/USD or all"
              />
              <NumberConfigCard
                label="Max digests / day (Starter)"
                description="WhatsApp digests per user per 24 h. 0 = disabled."
                configKey="community_whatsapp_daily_limit_starter"
                initialValue={communityLimitStarter}
                min={0}
                max={10}
                unit="/ day"
              />
              <p className="text-[10px] tracking-widest uppercase pt-2" style={{ color: "var(--muted-foreground)" }}>Plus</p>
              <TextConfigCard
                label="Symbols (Plus)"
                description="Comma-separated symbols or 'all'. Default: all"
                configKey="community_signal_symbols_plus"
                initialValue={communitySymbolsPlus}
                placeholder="e.g. all"
              />
              <NumberConfigCard
                label="Max digests / day (Plus)"
                description="WhatsApp digests per user per 24 h."
                configKey="community_whatsapp_daily_limit_plus"
                initialValue={communityLimitPlus}
                min={0}
                max={10}
                unit="/ day"
              />
              <p className="text-[10px] tracking-widest uppercase pt-2" style={{ color: "var(--muted-foreground)" }}>Pro</p>
              <TextConfigCard
                label="Symbols (Pro)"
                description="Comma-separated symbols or 'all'. Default: all"
                configKey="community_signal_symbols_pro"
                initialValue={communitySymbolsPro}
                placeholder="e.g. all"
              />
              <NumberConfigCard
                label="Max digests / day (Pro)"
                description="WhatsApp digests per user per 24 h."
                configKey="community_whatsapp_daily_limit_pro"
                initialValue={communityLimitPro}
                min={0}
                max={10}
                unit="/ day"
              />
            </div>
          </section>

          {/* Signal engine */}
          <section>
            <p
              className="text-[10px] tracking-widest uppercase mb-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              Signal Engine
            </p>
            <p
              className="text-xs mb-4"
              style={{ color: "var(--muted-foreground)" }}
            >
              Systemly shows every setup it finds — there is no confidence floor
              hiding signals from users. The five provider cards below set which
              model generates each path. Each one is only the first choice: if
              that provider is out of credit or down, the scan falls through to
              the others automatically and still produces a signal.
            </p>
            <div className="space-y-3">
              <TextConfigCard
                label="Manual Scan AI Provider"
                description="One user, one symbol, watching a loading screen. The only path on claude by default, because it is the only one where a person waits on a single answer. Options: claude, deepseek, openai. Takes effect on the next scan, no redeploy. A super user's own provider pick in in-app settings still wins for their own account. An unrecognised value is ignored and the default is used."
                configKey="signal_ai_model"
                initialValue={signalAiModel}
                placeholder="claude | deepseek | openai"
              />
              <TextConfigCard
                label="Scan Now AI Provider"
                description="The 'Scan now' button on a strategy page: one AI call per symbol in the strategy, on one click. deepseek by default for that reason, though a user is watching this one, so claude is defensible if the wait is acceptable. Options: claude, deepseek, openai."
                configKey="scan_now_ai_model"
                initialValue={scanNowAiModel}
                placeholder="deepseek | claude | openai"
              />
              <TextConfigCard
                label="Strategy Scan Cron AI Provider"
                description="The scheduled scan that fills signal lists without anybody asking: every user's active strategies, every symbol, every two hours on weekdays. The highest-volume path after community, and nobody is watching any single call. deepseek by default. Options: claude, deepseek, openai. Takes effect on the next cron run."
                configKey="strategy_cron_ai_model"
                initialValue={strategyCronAiModel}
                placeholder="deepseek | claude | openai"
              />
              <TextConfigCard
                label="Backtest AI Provider"
                description="Replaying a strategy over past candles: hundreds of AI calls behind one progress bar. deepseek by default. Changing this changes what future backtest results were generated by, so results from before and after are not directly comparable. Options: claude, deepseek, openai."
                configKey="backtest_ai_model"
                initialValue={backtestAiModel}
                placeholder="deepseek | claude | openai"
              />
              <TextConfigCard
                label="Community AI Provider"
                description="The community feed: 15 symbols, four runs a day. deepseek by default. Switch to claude if DeepSeek is degraded. Options: claude, deepseek, openai. Takes effect on the next cron run, no redeploy."
                configKey="community_ai_model"
                initialValue={communityAiModel}
                placeholder="deepseek | claude | gemini"
              />
              <TextConfigCard
                label="Alert Basis"
                description="Which score decides whether a signal sends a push / WhatsApp / Telegram alert. plan_quality (default): what the trade pays if it goes the right way, worked out in code when the signal is saved. confidence: the model's own percentage, the rule before 2026-09-14, kept as a rollback. Anything else is read as plan_quality. Takes effect on the next scan, no redeploy."
                configKey="signal_alert_basis"
                initialValue={signalAlertBasis}
                placeholder="plan_quality | confidence"
              />
              <NumberConfigCard
                label="Alert Threshold (plan quality)"
                description="Minimum plan quality before a signal triggers an alert, when Alert Basis is plan_quality. Default 60, chosen to keep alert volume where it was: 14.1% of signals since 1 September clear it, against 13.8% for confidence at 60. Re-measure after any change to where the first target is placed, because plan quality moves with it. A signal whose plan could not be scored never alerts. Does NOT hide anything: every signal still appears in the app. 0 = alert on every scored signal."
                configKey="signal_alert_min_plan_quality"
                initialValue={signalAlertMinPlanQuality}
                min={0}
                max={100}
                unit="score"
              />
              <NumberConfigCard
                label="Rollback Threshold (confidence)"
                description="Only read when Alert Basis is set to confidence. Minimum model confidence before a signal triggers an alert, exactly as alerts worked before 2026-09-14. Does NOT hide anything: every signal still appears in the app. 0 = alert on everything."
                configKey="signal_alert_min_confidence"
                initialValue={signalAlertMinConfidence}
                min={0}
                max={100}
                unit="score"
              />
            </div>
          </section>

          {/* Cron triggers — invoke main app jobs on demand */}
          <section>
            <p
              className="text-[10px] tracking-widest uppercase mb-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              Cron Triggers
            </p>
            <p
              className="text-xs mb-4"
              style={{ color: "var(--muted-foreground)" }}
            >
              Manually invoke a main-app cron job. Forwards with the shared CRON_SECRET.
            </p>
            <CronTriggerList mainAppUrl={process.env.MAIN_APP_URL ?? "not set"} />
          </section>

          {/* System config viewer */}
          <section>
            <p
              className="text-[10px] tracking-widest uppercase mb-4"
              style={{ color: "var(--muted-foreground)" }}
            >
              System Config (raw)
            </p>
            <div
              className="rounded-lg overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              {(allConfigs ?? []).map((config, i) => (
                <div
                  key={config.key}
                  className="px-4 py-3"
                  style={{
                    borderBottom:
                      i < (allConfigs?.length ?? 0) - 1
                        ? "1px solid var(--border)"
                        : "none",
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs font-mono font-semibold"
                      style={{ color: "var(--primary)" }}
                    >
                      {config.key}
                    </span>
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {config.updated_at
                        ? new Date(config.updated_at as string).toLocaleString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )
                        : "—"}
                    </span>
                  </div>
                  <pre
                    className="text-xs font-mono overflow-auto"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {JSON.stringify(config.value, null, 2)}
                  </pre>
                </div>
              ))}
              {(allConfigs?.length ?? 0) === 0 && (
                <p
                  className="px-4 py-3 text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  No system config entries
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
