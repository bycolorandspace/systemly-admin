"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  answerLabel,
  PLANS,
  planLabel,
  QUESTION_KEYS,
  QUESTION_SHORT,
} from "@/lib/feedback-labels";
import type { FeedbackListItem } from "@/lib/queries/feedback";
import { formatDate } from "@/lib/utils";
import { FeedbackNotice } from "./feedback-notice";
import { FeedbackSection, TH_CLASS } from "./feedback-section";

const PAGE_SIZE = 50;

type ListResponse =
  | { status: "ok"; data: { items: FeedbackListItem[]; total: number } }
  | { status: "missing_table" }
  | { status: "error"; message: string };

const FIELD_STYLE = {
  background: "var(--secondary)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
} as const;

export function ResponseList() {
  const [question, setQuestion] = useState("");
  const [plan, setPlan] = useState("");
  const [rating, setRating] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ListResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (question) params.set("question", question);
    if (plan) params.set("plan", plan);
    if (rating) params.set("rating", rating);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    try {
      const res = await fetch(`/api/admin/feedback?${params}`);
      if (!res.ok) throw new Error(String(res.status));
      setResult((await res.json()) as ListResponse);
    } catch {
      setResult({ status: "error", message: "The response list could not be loaded." });
    }
    setLoading(false);
  }, [question, plan, rating, from, to, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const change = (set: (v: string) => void) => (e: { target: { value: string } }) => {
    set(e.target.value);
    setPage(0);
  };

  const ok = result?.status === "ok" ? result.data : null;
  const totalPages = ok ? Math.max(1, Math.ceil(ok.total / PAGE_SIZE)) : 1;
  const filtered = Boolean(question || plan || rating || from || to);

  return (
    <FeedbackSection title="All responses">
      <div
        className="flex items-center gap-3 flex-wrap px-6 py-3 border-y"
        style={{ borderColor: "var(--border)" }}
      >
        <select aria-label="Question" value={question} onChange={change(setQuestion)} className="text-sm rounded-md px-3 py-2 outline-none" style={FIELD_STYLE}>
          <option value="">All questions</option>
          {QUESTION_KEYS.map((q) => (
            <option key={q} value={q}>{QUESTION_SHORT[q]}</option>
          ))}
        </select>
        <select aria-label="Plan" value={plan} onChange={change(setPlan)} className="text-sm rounded-md px-3 py-2 outline-none" style={FIELD_STYLE}>
          <option value="">All plans</option>
          {PLANS.map((p) => (
            <option key={p} value={p}>{planLabel(p)}</option>
          ))}
        </select>
        <select aria-label="Rating" value={rating} onChange={change(setRating)} className="text-sm rounded-md px-3 py-2 outline-none" style={FIELD_STYLE}>
          <option value="">Any rating</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n} star{n === 1 ? "" : "s"}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
          From
          <input type="date" value={from} max={to || undefined} onChange={change(setFrom)} className="text-sm rounded-md px-2 py-1.5 outline-none" style={FIELD_STYLE} />
        </label>
        <label className="flex items-center gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
          To
          <input type="date" value={to} min={from || undefined} onChange={change(setTo)} className="text-sm rounded-md px-2 py-1.5 outline-none" style={FIELD_STYLE} />
        </label>
        <span className="text-xs ml-auto metric-number" style={{ color: "var(--muted-foreground)" }}>
          {ok ? `${ok.total.toLocaleString()} ${ok.total === 1 ? "response" : "responses"}` : ""}
        </span>
      </div>

      {result?.status === "missing_table" && <FeedbackNotice kind="missing_table" />}
      {result?.status === "error" && <FeedbackNotice kind="error" message={result.message} />}

      {!result && loading && (
        <p className="px-6 py-8 text-sm" style={{ color: "var(--muted-foreground)" }} role="status">
          Loading responses…
        </p>
      )}

      {ok && ok.items.length === 0 && (
        <p className="px-6 py-8 text-sm" style={{ color: "var(--muted-foreground)" }}>
          {filtered
            ? "No responses match these filters."
            : "No feedback has been sent yet. Responses will appear here as users answer."}
        </p>
      )}

      {ok && ok.items.length > 0 && (
        <div className="overflow-auto" style={{ opacity: loading ? 0.5 : 1 }} aria-busy={loading}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Date", "User", "Question", "Answer", "Text", "Rating", "Plan", "Page", "Gift"].map((h) => (
                  <th key={h} className={TH_CLASS} style={{ color: "var(--muted-foreground)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ok.items.map((r) => (
                <tr key={r.id} className="align-top hover:bg-accent transition-colors" style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-6 py-3 whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>{formatDate(r.createdAt)}</td>
                  <td className="px-6 py-3" style={{ color: "var(--foreground)" }}>{r.email ?? "Unknown user"}</td>
                  <td className="px-6 py-3 whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>{QUESTION_SHORT[r.question] ?? r.question}</td>
                  <td className="px-6 py-3" style={{ color: "var(--foreground)" }}>{answerLabel(r.answerOption) || "-"}</td>
                  {/* Plain text node: user-typed, so never HTML, markdown or links. */}
                  <td className="px-6 py-3 max-w-xs whitespace-pre-wrap break-words" style={{ color: "var(--foreground)" }}>
                    {r.answerText || "-"}
                  </td>
                  <td className="px-6 py-3 metric-number" style={{ color: "var(--foreground)" }}>{r.rating} / 5</td>
                  <td className="px-6 py-3 whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>
                    {planLabel(r.plan)}{r.isTrial ? " (trial)" : ""}
                  </td>
                  <td className="px-6 py-3 break-all" style={{ color: "var(--muted-foreground)" }}>{r.page ?? "-"}</td>
                  <td className="px-6 py-3 whitespace-nowrap metric-number" style={{ color: "var(--muted-foreground)" }}>
                    {r.giftSignals != null
                      ? `${r.giftSignals} signals${r.giftSlug ? ` (${r.giftSlug})` : ""}`
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ok && totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3">
          <span className="text-xs metric-number" style={{ color: "var(--muted-foreground)" }}>
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button type="button" aria-label="Previous page" disabled={page === 0 || loading} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded-md disabled:opacity-30" style={FIELD_STYLE}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button type="button" aria-label="Next page" disabled={page + 1 >= totalPages || loading} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded-md disabled:opacity-30" style={FIELD_STYLE}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </FeedbackSection>
  );
}
