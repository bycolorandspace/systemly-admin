/**
 * Labels for the in-app feedback questions.
 *
 * Copied by hand from `FEEDBACK_COPY.questions` in the main app's
 * `helpers/feedback-copy.ts`. The admin app never imports across repos, so when
 * a label changes there, change it here too. An answer slug with no entry falls
 * back to the raw slug, so a new option shows up unlabelled rather than vanishing.
 */

export const QUESTION_KEYS = [
  "job",
  "disappointment",
  "build_next",
  "what_went_wrong",
  "open",
] as const;
export type QuestionKey = (typeof QUESTION_KEYS)[number];

export const PLANS = ["free", "starter", "plus", "pro"] as const;
export type FeedbackPlan = (typeof PLANS)[number];

export const QUESTION_LABELS: Record<QuestionKey, string> = {
  job: "What did you come to Systemly to do?",
  disappointment: "How would you feel if you could no longer use Systemly?",
  build_next: "What is one thing we should build next?",
  what_went_wrong: "What went wrong?",
  open: "Anything else?",
};

/** Short names for filters and column heads. */
export const QUESTION_SHORT: Record<QuestionKey, string> = {
  job: "Job",
  disappointment: "Disappointment",
  build_next: "Build next",
  what_went_wrong: "What went wrong",
  open: "Open",
};

export const JOB_OPTIONS = [
  { value: "find_trade_idea", label: "Find a trade idea" },
  { value: "check_my_trade", label: "Check a trade I already have" },
  { value: "learn", label: "Learn to trade better" },
  { value: "manage_risk", label: "Manage my risk" },
  { value: "something_else", label: "Something else" },
] as const;

export const DISAPPOINTMENT_OPTIONS = [
  { value: "very_disappointed", label: "Very disappointed" },
  { value: "somewhat_disappointed", label: "Somewhat disappointed" },
  { value: "not_disappointed", label: "Not disappointed" },
  { value: "would_not_notice", label: "I would not notice" },
] as const;

export const WENT_WRONG_OPTIONS = [
  { value: "too_few_signals", label: "Too few signals" },
  { value: "did_not_trust_levels", label: "Did not trust the levels" },
  { value: "hard_to_understand", label: "Hard to understand" },
  { value: "too_slow", label: "Too slow" },
  { value: "other", label: "Other" },
] as const;

const ANSWER_LABELS: Record<string, string> = Object.fromEntries(
  [...JOB_OPTIONS, ...DISAPPOINTMENT_OPTIONS, ...WENT_WRONG_OPTIONS].map((o) => [
    o.value,
    o.label,
  ]),
);

export function answerLabel(slug: string | null): string {
  if (!slug) return "";
  return ANSWER_LABELS[slug] ?? slug;
}

export function isQuestionKey(v: string | null | undefined): v is QuestionKey {
  return !!v && (QUESTION_KEYS as readonly string[]).includes(v);
}

export function isPlan(v: string | null | undefined): v is FeedbackPlan {
  return !!v && (PLANS as readonly string[]).includes(v);
}

export function planLabel(p: string): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

/** Sean Ellis benchmark: 40% or more "very disappointed" suggests product-market fit. */
export const SEAN_ELLIS_BENCHMARK = 40;
/** Below this many people, a percentage is direction only. */
export const MIN_SAMPLE = 30;
