import type { AcademyCourseRow } from "@/lib/queries/engagement";

/**
 * Per-course engagement, ordered by how many people opened it.
 *
 * The gap between "viewed" and "started" is the column to read. A course with
 * many viewers and no starters is not an unpopular course, it is a course whose
 * first lesson nobody is willing to begin, and that is a fixable thing.
 */
export function AcademyCourseTable({ rows }: { rows: AcademyCourseRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="px-6 py-8">
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          No courses in the catalogue.
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-5">
      <p
        className="text-[10px] tracking-widest uppercase mb-4"
        style={{ color: "var(--muted-foreground)" }}
      >
        By course
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr
              className="text-left border-b"
              style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
            >
              <th className="py-2 pr-4 font-medium uppercase text-[10px] tracking-wider">
                Course
              </th>
              <th className="py-2 px-3 font-medium uppercase text-[10px] tracking-wider">
                Tier
              </th>
              <th className="py-2 px-3 font-medium uppercase text-[10px] tracking-wider text-right">
                Lessons
              </th>
              <th className="py-2 px-3 font-medium uppercase text-[10px] tracking-wider text-right">
                Viewed
              </th>
              <th className="py-2 px-3 font-medium uppercase text-[10px] tracking-wider text-right">
                Started
              </th>
              <th className="py-2 px-3 font-medium uppercase text-[10px] tracking-wider text-right">
                Completed
              </th>
              <th className="py-2 pl-3 font-medium uppercase text-[10px] tracking-wider text-right">
                Pass rate
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr
                key={c.slug}
                className="border-b"
                style={{ borderColor: "var(--border)" }}
              >
                <td className="py-2.5 pr-4" style={{ color: "var(--foreground)" }}>
                  <span className="font-medium">{c.title}</span>
                  {!c.published && (
                    <span
                      className="ml-2 text-[9px] uppercase tracking-wider"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      draft
                    </span>
                  )}
                  <span
                    className="block font-mono text-[10px]"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {c.slug}
                  </span>
                </td>
                <td className="py-2.5 px-3" style={{ color: "var(--muted-foreground)" }}>
                  {c.tier_required ?? "free"}
                </td>
                <td
                  className="py-2.5 px-3 text-right metric-number"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {c.lessons}
                </td>
                <td
                  className="py-2.5 px-3 text-right metric-number"
                  style={{ color: "var(--foreground)" }}
                >
                  {c.viewers}
                </td>
                <td
                  className="py-2.5 px-3 text-right metric-number"
                  style={{ color: "var(--foreground)" }}
                >
                  {c.learners}
                </td>
                <td
                  className="py-2.5 px-3 text-right metric-number"
                  style={{ color: "var(--success)" }}
                >
                  {c.lessons_completed}
                </td>
                <td
                  className="py-2.5 pl-3 text-right metric-number"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {c.pass_rate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
