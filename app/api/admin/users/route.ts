import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getUsersList, type UserActivityFilter } from "@/lib/queries/users";

const ACTIVITY_VALUES: UserActivityFilter[] = ["all", "signal", "academy"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const tier = searchParams.get("tier") ?? "all";
  const page = parseInt(searchParams.get("page") ?? "0", 10);
  const activityParam = searchParams.get("activity") ?? "all";
  // An unknown value falls back to the default order rather than returning an
  // empty list, which would read as "nobody has done this".
  const activity = ACTIVITY_VALUES.includes(activityParam as UserActivityFilter)
    ? (activityParam as UserActivityFilter)
    : "all";

  const supabase = createAdminClient();
  const result = await getUsersList(supabase, {
    search,
    tierFilter: tier,
    activityFilter: activity,
    page,
    pageSize: 50,
  });

  return NextResponse.json(result);
}
