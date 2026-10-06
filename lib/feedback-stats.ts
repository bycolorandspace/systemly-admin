import {
  JOB_OPTIONS,
  PLANS,
  QUESTION_KEYS,
  type FeedbackPlan,
  type QuestionKey,
} from "@/lib/feedback-labels";

/** The columns the overview needs. No email: it is aggregated, not listed. */
export interface FeedbackRow {
  user_id: string;
  question_key: QuestionKey;
  scheduled_key: string | null;
  answer_option: string | null;
  answer_text: string | null;
  rating: number;
  plan: FeedbackPlan;
  is_trial: boolean;
  created_at: string;
}

export interface PlanCounts {
  free: number;
  starter: number;
  plus: number;
  pro: number;
  total: number;
}

export interface DistributionRow {
  value: string;
  byPlan: PlanCounts;
}

export interface DisappointmentSlice {
  key: string;
  label: string;
  /** People (latest answer each) in this slice. */
  n: number;
  veryDisappointed: number;
}

export interface TextEntry {
  id: string;
  text: string;
  plan: FeedbackPlan;
  isTrial: boolean;
  createdAt: string;
  answerOption: string | null;
  scheduledKey: string | null;
}

export interface WeeklyRating {
  /** Monday, UTC, as YYYY-MM-DD. */
  week: string;
  average: number;
  n: number;
}

export interface SendRow {
  question: QuestionKey;
  last30: number;
  /** Of the last-30-day what_went_wrong answers, how many replaced this question. */
  replacedLast30: number;
}

export interface FeedbackOverview {
  totalRows: number;
  /** True when the read hit the row cap, so older answers are missing. */
  truncated: boolean;
  job: { total: number; rows: DistributionRow[] };
  disappointment: {
    overall: DisappointmentSlice;
    byJob: DisappointmentSlice[];
    byPlan: DisappointmentSlice[];
  };
  buildNext: TextEntry[];
  wentWrong: { total: number; rows: DistributionRow[]; texts: TextEntry[] };
  rating: {
    n: number;
    average: number | null;
    distribution: { rating: number; count: number }[];
    weekly: WeeklyRating[];
  };
  sends: SendRow[];
}

function emptyCounts(): PlanCounts {
  return { free: 0, starter: 0, plus: 0, pro: 0, total: 0 };
}

function distribution(rows: FeedbackRow[], order: readonly string[]): DistributionRow[] {
  const map = new Map<string, PlanCounts>(order.map((v) => [v, emptyCounts()]));
  for (const r of rows) {
    if (!r.answer_option) continue;
    if (!map.has(r.answer_option)) map.set(r.answer_option, emptyCounts());
    const c = map.get(r.answer_option)!;
    c[r.plan] += 1;
    c.total += 1;
  }
  return [...map.entries()].map(([value, byPlan]) => ({ value, byPlan }));
}

function toText(r: FeedbackRow, id: string): TextEntry | null {
  const text = r.answer_text?.trim();
  if (!text) return null;
  return {
    id,
    text,
    plan: r.plan,
    isTrial: r.is_trial,
    createdAt: r.created_at,
    answerOption: r.answer_option,
    scheduledKey: r.scheduled_key,
  };
}

/** Rows arrive newest first, so the first seen per user is their latest. */
function latestPerUser(rows: FeedbackRow[]): Map<string, FeedbackRow> {
  const out = new Map<string, FeedbackRow>();
  for (const r of rows) if (!out.has(r.user_id)) out.set(r.user_id, r);
  return out;
}

function mondayOf(iso: string): string {
  const d = new Date(iso);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

const TEXT_LIST_CAP = 100;
const WEEKS_SHOWN = 12;

/**
 * Turns rows (newest first) into everything the page shows. Pure, so it runs
 * on the server with no extra queries.
 *
 * Disappointment counts each person once, by their latest answer, because the
 * Sean Ellis figure is a share of respondents and a person who is asked twice
 * would otherwise count twice. Their plan is the plan on that latest answer.
 */
export function buildOverview(rows: FeedbackRow[], truncated: boolean): FeedbackOverview {
  const byQuestion = (q: QuestionKey) => rows.filter((r) => r.question_key === q);

  const jobRows = byQuestion("job");
  const jobDist = distribution(jobRows, JOB_OPTIONS.map((o) => o.value));

  // Disappointment
  const latestJob = latestPerUser(jobRows);
  const latestDis = [...latestPerUser(byQuestion("disappointment")).values()].filter(
    (r) => r.answer_option,
  );
  const slice = (key: string, label: string, members: FeedbackRow[]): DisappointmentSlice => ({
    key,
    label,
    n: members.length,
    veryDisappointed: members.filter((r) => r.answer_option === "very_disappointed").length,
  });
  const byJob: DisappointmentSlice[] = [
    ...JOB_OPTIONS.map((o) =>
      slice(
        o.value,
        o.label,
        latestDis.filter((r) => latestJob.get(r.user_id)?.answer_option === o.value),
      ),
    ),
    slice(
      "none",
      "No job answer",
      latestDis.filter((r) => !latestJob.get(r.user_id)?.answer_option),
    ),
  ];
  const byPlan = PLANS.map((p) =>
    slice(p, p, latestDis.filter((r) => r.plan === p)),
  );

  // Text lists
  const buildNext = byQuestion("build_next")
    .map((r, i) => toText(r, `bn-${i}`))
    .filter((t): t is TextEntry => t !== null)
    .slice(0, TEXT_LIST_CAP);

  const wrongRows = byQuestion("what_went_wrong");
  const wentWrongTexts = wrongRows
    .map((r, i) => toText(r, `ww-${i}`))
    .filter((t): t is TextEntry => t !== null)
    .slice(0, TEXT_LIST_CAP);

  // Rating
  const rated = rows.filter((r) => Number.isFinite(r.rating));
  const sum = rated.reduce((s, r) => s + r.rating, 0);
  const weeks = new Map<string, { sum: number; n: number }>();
  for (const r of rated) {
    const w = mondayOf(r.created_at);
    const cur = weeks.get(w) ?? { sum: 0, n: 0 };
    cur.sum += r.rating;
    cur.n += 1;
    weeks.set(w, cur);
  }
  const weekly = [...weeks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-WEEKS_SHOWN)
    .map(([week, v]) => ({ week, average: v.sum / v.n, n: v.n }));

  // Sends, last 30 days
  const cutoff = Date.now() - 30 * 86400000;
  const recent = rows.filter((r) => new Date(r.created_at).getTime() >= cutoff);
  const sends: SendRow[] = QUESTION_KEYS.map((q) => ({
    question: q,
    last30: recent.filter((r) => r.question_key === q).length,
    replacedLast30: recent.filter(
      (r) => r.question_key === "what_went_wrong" && r.scheduled_key === q,
    ).length,
  }));

  return {
    totalRows: rows.length,
    truncated,
    job: { total: jobRows.filter((r) => r.answer_option).length, rows: jobDist },
    disappointment: {
      overall: slice("all", "Everyone", latestDis),
      byJob,
      byPlan,
    },
    buildNext,
    wentWrong: {
      total: wrongRows.filter((r) => r.answer_option).length,
      rows: distribution(wrongRows, ["too_few_signals", "did_not_trust_levels", "hard_to_understand", "too_slow", "other"]),
      texts: wentWrongTexts,
    },
    rating: {
      n: rated.length,
      average: rated.length ? sum / rated.length : null,
      distribution: [1, 2, 3, 4, 5].map((n) => ({
        rating: n,
        count: rated.filter((r) => r.rating === n).length,
      })),
      weekly,
    },
    sends,
  };
}
