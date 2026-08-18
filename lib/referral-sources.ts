// Keyed on the exact labels in the main app's REFERRAL_SOURCES
// (systemlyai/config/onboarding-goals.ts). Anything unrecognised, including
// labels added there later, falls back to grey rather than rendering an
// undefined colour. Kept here rather than in a component so the users table
// and the acquisition panel can never drift apart on colour.
export const REFERRAL_SOURCE_COLORS: Record<string, string> = {
  Instagram: "#ec4899",
  TikTok: "#06b6d4",
  "X (Twitter)": "#a1a1aa",
  YouTube: "#ef4444",
  Reddit: "#f97316",
  LinkedIn: "#0ea5e9",
  "Google / Search": "#22c55e",
  "A friend": "#eab308",
  Podcast: "#8b5cf6",
  Newsletter: "#14b8a6",
  "AI tool (ChatGPT, Perplexity…)": "#a855f7",
  "App store": "#64748b",
};

export const UNKNOWN_SOURCE_COLOR = "#71717a";

export function referralSourceColor(source: string): string {
  return REFERRAL_SOURCE_COLORS[source] ?? UNKNOWN_SOURCE_COLOR;
}
