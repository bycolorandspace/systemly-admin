/**
 * Engagement and academy reports, fetched from the main app.
 *
 * Every other panel in this dashboard queries core's Supabase directly, and
 * these two deliberately do not:
 *
 * - **Academy** lives in a second Supabase project. Its credentials belong to
 *   one deployment, and that deployment is the main app. Adding a second client
 *   here would mean a second copy of those keys for no gain.
 * - **Engagement** is a real aggregation over `user_events`: a funnel, a
 *   per-user first/last pass, and path normalisation. Written here as well, the
 *   two copies would drift, and the definition of "a return" would quietly stop
 *   matching between the report and the product.
 *
 * Both are read with `CRON_SECRET`, the same way the Docs viewer reads
 * `/api/admin/docs`.
 */

export interface EngagementFunnel {
  signed_up: number;
  reached_scan_form: number;
  started_scan: number;
  completed_scan: number;
  hit_a_gate: number;
}

export interface LabelCount {
  label: string;
  count: number;
}

export interface EngagementReport {
  instrumentation_start: string;
  generated_at: string;
  funnel: EngagementFunnel;
  retention: {
    users_seen: number;
    returning_users: number;
    return_rate: number;
    returned_to: LabelCount[];
  };
  gates: LabelCount[];
  failures: LabelCount[];
  tiers_seen: LabelCount[];
}

export interface AcademyCourseRow {
  slug: string;
  title: string;
  published: boolean;
  tier_required: string | null;
  lessons: number;
  viewers: number;
  learners: number;
  lessons_completed: number;
  pass_rate: number;
}

export interface AcademyReport {
  generated_at: string;
  catalogue: { courses: number; published: number; lessons: number };
  participation: {
    viewers: number;
    learners: number;
    lessons_attempted: number;
    lessons_completed: number;
    view_to_learn_rate: number;
  };
  streaks: {
    users_with_streak: number;
    active_streaks: number;
    longest: number;
    total_xp_awarded: number;
  };
  by_course: AcademyCourseRow[];
}

export interface AcademyUserBrief {
  enrolled: boolean;
  lessons_completed: number;
  lessons_attempted: number;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  last_visit_at: string | null;
  visits: number;
  courses_touched: string[];
}

async function fetchFromMainApp<T>(path: string): Promise<T | null> {
  const base = process.env.MAIN_APP_URL || "http://localhost:3000";
  const secret = process.env.CRON_SECRET || "";

  try {
    const res = await fetch(`${base}${path}`, {
      headers: { Authorization: `Bearer ${secret}` },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // A null return renders as "unavailable" rather than as zeros. Zeros here
    // would read as "nobody used it", which is a different and much more
    // expensive conclusion to draw by accident.
    return null;
  }
}

export function getEngagementReport() {
  return fetchFromMainApp<EngagementReport>("/api/admin/engagement");
}

export function getAcademyReport() {
  return fetchFromMainApp<AcademyReport>("/api/admin/academy");
}

export function getAcademyUserBrief(userId: string) {
  return fetchFromMainApp<AcademyUserBrief>(
    `/api/admin/academy?userId=${encodeURIComponent(userId)}`,
  );
}
