import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getUsersList } from "@/lib/queries/users";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const tier = searchParams.get("tier") ?? "all";
  const page = parseInt(searchParams.get("page") ?? "0", 10);

  const supabase = createAdminClient();
  const result = await getUsersList(supabase, {
    search,
    tierFilter: tier,
    page,
    pageSize: 50,
  });

  return NextResponse.json(result);
}
