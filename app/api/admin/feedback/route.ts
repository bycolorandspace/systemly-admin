import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getFeedbackList, parseListFilters } from "@/lib/queries/feedback";

/**
 * Filtered, paged response list. Guarded by `proxy.ts`, which checks is_super
 * for every path including /api, like the other admin routes. Filter values are
 * whitelisted in `parseListFilters`, never passed to the query as typed.
 */
export async function GET(req: NextRequest) {
  const filters = parseListFilters(new URL(req.url).searchParams);
  const result = await getFeedbackList(createAdminClient(), filters);
  return NextResponse.json(result);
}
