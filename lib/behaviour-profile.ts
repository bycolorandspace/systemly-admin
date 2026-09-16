/**
 * The "July rails" switch on a strategy: `strategies.config.behaviour_profile`.
 *
 * When a strategy carries it, the main app scans it the way it did in July 2026: the July
 * checks before a trade, targets as multiples of the stop, the July scorecard stored alongside
 * today's, and chart structure shown to users but not used to place the stop or targets. On the
 * community feed a failed check skips the market; users' own scans always return a trade.
 *
 * Mirrors JULY_2026_PROFILE in the main app (helpers/strategy-behaviour.ts). Separate repo, no
 * shared code, so keep the two identical: the main app only recognises these exact values.
 */

export const JULY_2026_PROFILE = {
  gates: "june_2026",
  target_placement: "rr_multiple",
  reward_rubric: "june_2026",
  price_action_plan: "display_only",
} as const;

export type BehaviourProfile = Record<keyof typeof JULY_2026_PROFILE, string>;

/** What each switch does, for the read-only list under the toggle. */
export const BEHAVIOUR_PROFILE_SWITCHES: {
  key: keyof typeof JULY_2026_PROFILE;
  label: string;
}[] = [
  { key: "gates", label: "July checks before a trade (community skips on a fail)" },
  { key: "target_placement", label: "Targets as multiples of the stop distance" },
  { key: "reward_rubric", label: "July scorecard stored as gate_confidence" },
  { key: "price_action_plan", label: "FVG, liquidity and swings shown, not used to place levels" },
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The stored profile, or null when the strategy has none (a missing key and JSON null alike). */
export function readBehaviourProfile(value: unknown): BehaviourProfile | null {
  if (!isPlainObject(value)) return null;
  const keys = Object.keys(JULY_2026_PROFILE) as (keyof typeof JULY_2026_PROFILE)[];
  if (!keys.every((k) => typeof value[k] === "string")) return null;
  return Object.fromEntries(keys.map((k) => [k, value[k] as string])) as BehaviourProfile;
}

/** `config` with the July profile set (on) or the key removed (off). Every other key is untouched. */
export function setBehaviourProfile(
  config: Record<string, unknown>,
  enabled: boolean,
): Record<string, unknown> {
  const next = { ...config };
  if (enabled) next.behaviour_profile = { ...JULY_2026_PROFILE };
  else delete next.behaviour_profile;
  return next;
}

/**
 * A candidate's config as it should land on the live strategy: everything from the candidate,
 * except the behaviour profile, which stays as the live row has it. The switch has its own
 * toggle; promoting tuned settings must not flip it as a side effect (a candidate copied before
 * the switch was turned on would otherwise turn it off).
 */
export function keepLiveBehaviourProfile(
  candidateConfig: unknown,
  liveConfig: unknown,
): unknown {
  if (!isPlainObject(candidateConfig)) return candidateConfig;
  const next = { ...candidateConfig };
  delete next.behaviour_profile;
  const liveProfile = isPlainObject(liveConfig) ? liveConfig.behaviour_profile : undefined;
  if (liveProfile) next.behaviour_profile = liveProfile;
  return next;
}
