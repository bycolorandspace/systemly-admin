import type { AcademyReport } from "@/lib/queries/engagement";

interface KpiProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "success" | "muted";
}

function Kpi({ label, value, hint, tone = "default" }: KpiProps) {
  const color =
    tone === "success"
      ? "var(--success)"
      : tone === "muted"
        ? "var(--muted-foreground)"
        : "var(--foreground)";

  return (
    <div>
      <p
        className="text-[10px] uppercase tracking-wider mb-1"
        style={{ color: "var(--muted-foreground)" }}
      >
        {label}
      </p>
      <p className="text-2xl font-bold metric-number" style={{ color }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {hint && (
        <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

/**
 * The academy in one row.
 *
 * "Viewers" and "learners" are deliberately separate. Someone who opens a
 * course page and never starts a lesson has told us something different from
 * someone who never looked, and collapsing the two into a single "users" number
 * would hide the step where the academy actually loses people.
 */
export function AcademyKpiStrip({ data }: { data: AcademyReport }) {
  return (
    <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
      <p
        className="text-[10px] tracking-widest uppercase mb-4"
        style={{ color: "var(--muted-foreground)" }}
      >
        Participation
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        <Kpi
          label="Viewers"
          value={data.participation.viewers}
          hint="opened any academy page"
        />
        <Kpi
          label="Learners"
          value={data.participation.learners}
          hint="attempted a lesson"
          tone="success"
        />
        <Kpi
          label="View to learn"
          value={`${data.participation.view_to_learn_rate}%`}
          hint="viewers who started"
        />
        <Kpi
          label="Lessons done"
          value={data.participation.lessons_completed}
          hint={`of ${data.participation.lessons_attempted} attempted`}
        />
        <Kpi
          label="Active streaks"
          value={data.streaks.active_streaks}
          hint={`${data.streaks.users_with_streak} have one`}
        />
        <Kpi label="Longest streak" value={data.streaks.longest} hint="days" />
        <Kpi
          label="XP awarded"
          value={data.streaks.total_xp_awarded}
          tone="muted"
        />
      </div>

      <p className="text-[10px] mt-4" style={{ color: "var(--muted-foreground)" }}>
        Catalogue: {data.catalogue.published} of {data.catalogue.courses} courses
        published, {data.catalogue.lessons} lessons. Progress and streaks come from
        the academy Supabase project; views come from core&apos;s user_events.
      </p>
    </div>
  );
}
