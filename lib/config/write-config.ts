import "server-only";

import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase";

/**
 * Write one `system_config` row as a named admin, and record the change in the main app's
 * append-only audit trail (`security_events`, event type `config_changed`, metadata: key, old
 * value, new value). Shared by `/api/admin/toggle-config` and `/api/admin/set-config`, which
 * check the key against `lib/config/writable-config-keys.ts` before calling this.
 *
 * Added 2 October 2026. The audit write is best effort: it is logged if it fails but does not
 * undo the change, matching `logSecurityEvent()` in the main app (`lib/services/security-events.ts`).
 * The row itself carries `updated_by`, so the last writer is known even if the audit row is lost.
 */
export async function writeConfigAsAdmin(input: {
  key: string;
  value: unknown;
  adminId: string;
  req: NextRequest;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createAdminClient();

  const { data: before, error: readError } = await supabase
    .from("system_config")
    .select("value")
    .eq("key", input.key)
    .maybeSingle();
  if (readError) {
    console.error("[write-config] read before write failed", input.key, readError.message);
    return { ok: false, error: "Could not read the current value. Nothing was changed." };
  }

  const { error } = await supabase.from("system_config").upsert(
    {
      key: input.key,
      value: input.value,
      updated_at: new Date().toISOString(),
      updated_by: input.adminId,
    },
    { onConflict: "key" },
  );
  if (error) {
    console.error("[write-config] upsert failed", input.key, error.message);
    return { ok: false, error: "Could not save the change. Nothing was changed." };
  }

  const { error: auditError } = await supabase.from("security_events").insert({
    user_id: input.adminId,
    event_type: "config_changed",
    ip: input.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    user_agent: input.req.headers.get("user-agent")?.slice(0, 300) ?? null,
    metadata: {
      key: input.key,
      old_value: before?.value ?? null,
      new_value: input.value,
      source: "admin-dashboard",
    },
  });
  if (auditError) {
    console.error("[write-config] security_events insert failed", input.key, auditError.message);
  }

  return { ok: true };
}
