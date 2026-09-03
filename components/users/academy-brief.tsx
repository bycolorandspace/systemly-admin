import type { AcademyUserBrief } from "@/lib/queries/engagement";

/**
 * One user's academy activity, kept to the few numbers worth reading here.
 *
 * The full picture is the Academy page. This block answers one question while
 * someone is looking at a user record: has this person engaged with the
 * academy at all, and how recently. Anything more belongs on the report.
 */
export function AcademyBrief({ data }: { data: AcademyUserBrief | null }) {
  if (!data) return null;

  if (!data.enrolled) {
    return (
      <div>
        <p
          className="text-[10px] uppercase tracking-wider mb-2"
          style={{ color: "var(--muted-foreground)" }}
        >
          Academy
        </p>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Never opened.
        </p>
      </div>
    );
  }

  const lastSeen = data.last_visit_at ?? data.last_active_date;

  return (
    <div>
      <p
        className="text-[10px] uppercase tracking-wider mb-2"
        style={{ color: "var(--muted-foreground)" }}
      >
        Academy
      </p>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
            Done
          </p>
          <p
            className="text-sm font-bold metric-number"
            style={{ color: "var(--foreground)" }}
          >
            {data.lessons_completed}
            <span
              className="text-[10px] font-normal"
              style={{ color: "var(--muted-foreground)" }}
            >
              /{data.lessons_attempted}
            </span>
          </p>
        </div>
        <div>
          <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
            XP
          </p>
          <p
            className="text-sm font-bold metric-number"
            style={{ color: "var(--foreground)" }}
          >
            {data.total_xp.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
            Streak
          </p>
          <p
            className="text-sm font-bold metric-number"
            style={{ color: data.current_streak > 0 ? "var(--success)" : "var(--muted-foreground)" }}
          >
            {data.current_streak}
          </p>
        </div>
        <div>
          <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
            Visits
          </p>
          <p
            className="text-sm font-bold metric-number"
            style={{ color: "var(--foreground)" }}
          >
            {data.visits}
          </p>
        </div>
      </div>

      {lastSeen && (
        <p className="text-[10px] mt-2" style={{ color: "var(--muted-foreground)" }}>
          Last seen {new Date(lastSeen).toLocaleDateString()}
          {data.courses_touched.length > 0 && ` · ${data.courses_touched.join(", ")}`}
        </p>
      )}
    </div>
  );
}
