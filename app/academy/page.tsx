import { getAcademyReport } from "@/lib/queries/engagement";
import { AcademyKpiStrip } from "@/components/academy/academy-kpi-strip";
import { AcademyCourseTable } from "@/components/academy/academy-course-table";
import { Header } from "@/components/layout/header";

export const revalidate = 60;

/**
 * The academy's own report.
 *
 * Separate from Overview because the academy is a separate product surface
 * backed by a separate database, and its numbers are on a different scale from
 * revenue and signals. Folded into the Overview strip it would either dominate
 * the page or be rounded to nothing.
 */
export default async function AcademyPage() {
  const data = await getAcademyReport();

  return (
    <>
      <Header title="Academy" />
      <div className="flex-1 overflow-auto">
        {!data ? (
          <div className="px-6 py-8">
            <p className="text-sm" style={{ color: "var(--foreground)" }}>
              Academy report unavailable.
            </p>
            <p
              className="text-xs mt-2 max-w-prose"
              style={{ color: "var(--muted-foreground)" }}
            >
              The main app did not return a report. The academy runs on its own
              Supabase project, so this fails independently of everything else on
              this dashboard: check that <code>ACADEMY_SUPABASE_URL</code> and{" "}
              <code>ACADEMY_SUPABASE_SERVICE_ROLE_KEY</code> are set on the main
              app, and that <code>MAIN_APP_URL</code> and <code>CRON_SECRET</code>{" "}
              are set here.
            </p>
          </div>
        ) : (
          <>
            <AcademyKpiStrip data={data} />
            <AcademyCourseTable rows={data.by_course} />
          </>
        )}
      </div>
    </>
  );
}
