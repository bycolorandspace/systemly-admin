import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isPlan,
  isQuestionKey,
  type FeedbackPlan,
  type QuestionKey,
} from "@/lib/feedback-labels";
import { buildOverview, type FeedbackOverview, type FeedbackRow } from "@/lib/feedback-stats";

/**
 * Feedback reads. The table `feedback_responses` lives in the main project and
 * may not exist yet (the migration is pushed separately), so every read returns
 * a status instead of throwing: the page shows a notice for a missing table and
 * a plain error for anything else.
 */

/**
 * The most rows the overview reads. Neither Postgres client here can group, so
 * the page aggregates in memory; at the volume this table will have for a long
 * while, one capped read is cheaper than a view or an RPC.
 */
const OVERVIEW_ROW_CAP = 10000;
export const LIST_PAGE_SIZE = 50;

export type FeedbackResult<T> =
  | { status: "ok"; data: T }
  | { status: "missing_table" }
  | { status: "error"; message: string };

interface PgError {
  code?: string;
  message?: string;
}

function classify(error: PgError): { status: "missing_table" } | { status: "error"; message: string } {
  const msg = error.message ?? "";
  if (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /does not exist|could not find the table/i.test(msg)
  ) {
    return { status: "missing_table" };
  }
  // Raw driver text stays in the server log; the screen gets a plain line.
  console.error("[admin feedback] query failed:", error.code, msg);
  return { status: "error", message: "The feedback query failed. Check the server log." };
}

export async function getFeedbackOverview(
  supabase: SupabaseClient,
): Promise<FeedbackResult<FeedbackOverview>> {
  const { data, error } = await supabase
    .from("feedback_responses")
    .select(
      "user_id, question_key, scheduled_key, answer_option, answer_text, rating, plan, is_trial, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(OVERVIEW_ROW_CAP);

  if (error) return classify(error);
  const rows = (data ?? []) as FeedbackRow[];
  return {
    status: "ok",
    data: buildOverview(rows, rows.length >= OVERVIEW_ROW_CAP),
  };
}

export interface FeedbackListFilters {
  question?: QuestionKey;
  plan?: FeedbackPlan;
  rating?: number;
  /** YYYY-MM-DD, inclusive. */
  from?: string;
  /** YYYY-MM-DD, inclusive. */
  to?: string;
  page: number;
}

export interface FeedbackListItem {
  id: string;
  email: string | null;
  question: QuestionKey;
  answerOption: string | null;
  answerText: string | null;
  rating: number;
  plan: FeedbackPlan;
  isTrial: boolean;
  page: string | null;
  giftSlug: string | null;
  giftSignals: number | null;
  createdAt: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Reads a filter set from query-string values, dropping anything not on the whitelist. */
export function parseListFilters(params: URLSearchParams): FeedbackListFilters {
  const q = params.get("question");
  const p = params.get("plan");
  const r = Number(params.get("rating"));
  const from = params.get("from");
  const to = params.get("to");
  const page = Number.parseInt(params.get("page") ?? "0", 10);
  return {
    question: isQuestionKey(q) ? q : undefined,
    plan: isPlan(p) ? p : undefined,
    rating: Number.isInteger(r) && r >= 1 && r <= 5 ? r : undefined,
    from: from && DATE_RE.test(from) ? from : undefined,
    to: to && DATE_RE.test(to) ? to : undefined,
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 10000) : 0,
  };
}

function nextDay(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export async function getFeedbackList(
  supabase: SupabaseClient,
  f: FeedbackListFilters,
): Promise<FeedbackResult<{ items: FeedbackListItem[]; total: number }>> {
  let query = supabase
    .from("feedback_responses")
    .select(
      "id, user_id, question_key, answer_option, answer_text, rating, plan, is_trial, page, gift_slug, gift_signals, created_at",
      { count: "exact" },
    );
  if (f.question) query = query.eq("question_key", f.question);
  if (f.plan) query = query.eq("plan", f.plan);
  if (f.rating) query = query.eq("rating", f.rating);
  if (f.from) query = query.gte("created_at", `${f.from}T00:00:00Z`);
  if (f.to) query = query.lt("created_at", `${nextDay(f.to)}T00:00:00Z`);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(f.page * LIST_PAGE_SIZE, (f.page + 1) * LIST_PAGE_SIZE - 1);
  if (error) return classify(error);

  const rows = (data ?? []) as Record<string, unknown>[];
  const ids = [...new Set(rows.map((r) => r.user_id as string))];
  const emails = new Map<string, string | null>();
  if (ids.length) {
    // Same lookup the users list uses: user_profiles carries the email.
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, email")
      .in("id", ids);
    for (const p of profiles ?? []) emails.set(p.id as string, (p.email as string) ?? null);
  }

  return {
    status: "ok",
    data: {
      total: count ?? 0,
      items: rows.map((r) => ({
        id: r.id as string,
        email: emails.get(r.user_id as string) ?? null,
        question: r.question_key as QuestionKey,
        answerOption: (r.answer_option as string) ?? null,
        answerText: (r.answer_text as string) ?? null,
        rating: r.rating as number,
        plan: r.plan as FeedbackPlan,
        isTrial: Boolean(r.is_trial),
        page: (r.page as string) ?? null,
        giftSlug: (r.gift_slug as string) ?? null,
        giftSignals: (r.gift_signals as number) ?? null,
        createdAt: r.created_at as string,
      })),
    },
  };
}
