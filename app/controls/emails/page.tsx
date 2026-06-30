import { Header } from "@/components/layout/header";
import { EmailTemplatePanel, type EmailTypeDef } from "@/components/controls/email-template-panel";

const MAIN_APP_URL = process.env.MAIN_APP_URL ?? "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET ?? "";

const EMAIL_DEFS: EmailTypeDef[] = [
  {
    type: "welcome",
    label: "A — Welcome",
    desc: "Sent when onboarding data is saved for the first time.",
    previewParams: { firstName: "Alex", goal: "Supplement my income", experience: "1–3 years", skill: "Fairly confident" },
    fields: [
      { key: "subject", label: "Subject line" },
      { key: "goal_learn", label: "Body — goal: Learn & develop skills", multiline: true },
      { key: "goal_supplement", label: "Body — goal: Supplement my income", multiline: true },
      { key: "goal_passive", label: "Body — goal: Grow passive income", multiline: true },
      { key: "goal_fulltime", label: "Body — goal: Trade full-time", multiline: true },
      { key: "goal_default", label: "Body — goal fallback", multiline: true },
    ],
  },
  {
    type: "founder-checkin",
    label: "B — Founder Check-in",
    desc: "2 hours after onboarding. Plain text, personal.",
    previewParams: { firstName: "Alex" },
    fields: [
      { key: "subject", label: "Subject line" },
      { key: "body", label: "Body (use \\n\\n for paragraph breaks)", multiline: true },
    ],
  },
  {
    type: "activation-nudge",
    label: "C — Activation Nudge",
    desc: "Day 3, if user has run zero scans.",
    previewParams: { firstName: "Alex" },
    fields: [
      { key: "subject", label: "Subject line" },
      { key: "body_intro", label: "Body intro", multiline: true },
      { key: "body_steps", label: "Body steps", multiline: true },
      { key: "cta_label", label: "CTA button label" },
    ],
  },
  {
    type: "enable-notifications",
    label: "D — Enable Notifications",
    desc: "Day 3, if WhatsApp not enabled.",
    previewParams: { firstName: "Alex" },
    fields: [
      { key: "subject", label: "Subject line" },
      { key: "body_intro", label: "Body intro", multiline: true },
      { key: "body_what", label: "Body — what alerts cover", multiline: true },
      { key: "cta_label", label: "CTA button label" },
    ],
  },
  {
    type: "wins-digest",
    label: "E — Daily Digest",
    desc: "8pm local time, sent if user had outcomes that day.",
    previewParams: { firstName: "Alex", wins: "3", losses: "1", netPips: "47" },
    fields: [
      { key: "subject", label: "Subject line (use {date}, {wins}, {pips})" },
      { key: "body_intro", label: "Body intro", multiline: true },
      { key: "streak_label", label: "Streak label (use {n})" },
      { key: "cta_label", label: "CTA button label" },
    ],
  },
  {
    type: "community-momentum",
    label: "F — Community Momentum",
    desc: "Day 7, all users.",
    previewParams: { firstName: "Alex", topSymbol: "XAU/USD", topPips: "847" },
    fields: [
      { key: "subject", label: "Subject line (use {pips}, {symbol})" },
      { key: "body_intro", label: "Body intro (use {daysAgo})", multiline: true },
      { key: "body_cta", label: "Body CTA paragraph", multiline: true },
      { key: "cta_label", label: "CTA button label" },
    ],
  },
  {
    type: "what-you-missed",
    label: "G — What You Missed",
    desc: "Day 14, if user has < 3 signals.",
    previewParams: { firstName: "Alex", daysAgo: "14" },
    fields: [
      { key: "subject", label: "Subject line" },
      { key: "body_intro", label: "Body intro (use {daysAgo})", multiline: true },
      { key: "body_close", label: "Closing line", multiline: true },
      { key: "cta_label", label: "CTA button label" },
    ],
  },
  {
    type: "first-win",
    label: "H — First Win",
    desc: "Triggered on user's very first TP hit.",
    previewParams: { firstName: "Alex", symbol: "XAU/USD", alertType: "TP1", pips: "32" },
    fields: [
      { key: "subject", label: "Subject line (use {symbol}, {alertType}, {pips})" },
      { key: "body_intro", label: "Body", multiline: true },
      { key: "body_close", label: "Closing line" },
    ],
  },
  {
    type: "first-loss",
    label: "I — First Loss",
    desc: "Triggered on user's first SL hit (no prior TP hits).",
    previewParams: { firstName: "Alex", symbol: "XAU/USD", pips: "-18" },
    fields: [
      { key: "subject", label: "Subject line (use {symbol})" },
      { key: "body_intro", label: "Body intro", multiline: true },
      { key: "body_core", label: "Body core (expectancy explanation)", multiline: true },
      { key: "body_close", label: "Closing line" },
    ],
  },
  {
    type: "monthly-recap",
    label: "J — Monthly Recap",
    desc: "Day 30.",
    previewParams: { firstName: "Alex" },
    fields: [
      { key: "subject", label: "Subject line" },
      { key: "body_intro", label: "Body — user has data", multiline: true },
      { key: "body_no_data", label: "Body — user has no data", multiline: true },
      { key: "body_close", label: "Closing line" },
      { key: "cta_label", label: "CTA button label" },
    ],
  },
  {
    type: "winback-updates",
    label: "K — Winback (Day 60)",
    desc: "Sent if user inactive for 30+ days. Reads live DB for changelog.",
    previewParams: { firstName: "Alex" },
    fields: [
      { key: "subject", label: "Subject line (use {firstName})" },
      { key: "founder_letter", label: "Founder letter (use \\n\\n for paragraphs)", multiline: true },
      { key: "body_close", label: "Closing line" },
      { key: "cta_label", label: "CTA button label" },
      { key: "changelog_entries", label: "Changelog entries", json: true },
    ],
  },
  {
    type: "final-winback",
    label: "L — Final Winback (Day 90)",
    desc: "Last automated email for dormant users.",
    previewParams: { firstName: "Alex" },
    fields: [
      { key: "subject", label: "Subject line (use {firstName})" },
      { key: "body", label: "Body (use \\n\\n for paragraphs)", multiline: true },
    ],
  },
  {
    type: "pip-milestone",
    label: "M — Pip Milestone",
    desc: "Triggered at 100 / 500 / 1000 / 5000 / 10000 cumulative pips.",
    previewParams: { firstName: "Alex", pips: "500" },
    fields: [
      { key: "subject", label: "Subject line (use {pips})" },
      { key: "body_intro", label: "Body intro (use {pips})", multiline: true },
      { key: "body_close", label: "Closing line (use {nextMilestone})" },
    ],
  },
  {
    type: "win-streak",
    label: "N — Win Streak",
    desc: "Triggered on 3 consecutive winning days.",
    previewParams: { firstName: "Alex", streakDays: "3" },
    fields: [
      { key: "subject", label: "Subject line" },
      { key: "body_intro", label: "Body intro", multiline: true },
      { key: "body_tip", label: "Pro tip", multiline: true },
      { key: "cta_label", label: "CTA button label" },
    ],
  },
];

export default function EmailsPage() {
  return (
    <>
      <Header title="Email Templates" />
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          <p className="text-sm text-muted-foreground">
            Edit copy for all lifecycle emails. Changes take effect on the next send — no deploy needed.
            Preview renders the live DB copy. Send test delivers via Resend.
          </p>

          {EMAIL_DEFS.map((def) => (
            <details key={def.type} className="border rounded-lg">
              <summary className="px-4 py-3 cursor-pointer text-sm font-medium hover:bg-accent/50 rounded-lg">
                {def.label}
                <span className="ml-2 text-xs text-muted-foreground font-normal">{def.desc}</span>
              </summary>
              <div className="px-4 pb-4 pt-2 border-t">
                <EmailTemplatePanel def={def} mainAppUrl={MAIN_APP_URL} cronSecret={CRON_SECRET} />
              </div>
            </details>
          ))}
        </div>
      </div>
    </>
  );
}
