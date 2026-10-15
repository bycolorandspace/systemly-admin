import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireSuperUserId } from "@/lib/auth/require-super";
import { createAdminClient } from "@/lib/supabase";

const BUCKET = "onboarding-media";
const MB = 1024 * 1024;

/** What each upload kind accepts. The bucket enforces the same limits again on its side. */
const RULES = {
  video: { types: { "video/mp4": "mp4" }, maxBytes: 15 * MB },
  poster: {
    types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" },
    maxBytes: 1 * MB,
  },
} as const;

/**
 * POST /api/admin/onboarding-upload: mint a one-time signed upload URL for the onboarding video
 * or poster. The file never passes through this route (Vercel caps request bodies at about
 * 4.5 MB); the browser sends it straight to Supabase Storage with the returned URL.
 *
 * Body: { kind: "video" | "poster", fileName, contentType, size }.
 * Every upload gets a new random path, so an existing object is never overwritten and a cache
 * can never serve a stale file. The admin then saves `publicUrl` through /api/admin/set-config.
 */
export async function POST(req: NextRequest) {
  const auth = await requireSuperUserId(req);
  if ("response" in auth) return auth.response;

  let body: { kind?: unknown; fileName?: unknown; contentType?: unknown; size?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { kind, fileName, contentType, size } = body;

  if (kind !== "video" && kind !== "poster") {
    return NextResponse.json({ error: "kind must be video or poster" }, { status: 400 });
  }
  if (typeof fileName !== "string" || fileName.length === 0 || fileName.length > 200) {
    return NextResponse.json({ error: "A file name is required" }, { status: 400 });
  }
  const rule = RULES[kind];
  const ext = typeof contentType === "string"
    ? (rule.types as Record<string, string>)[contentType]
    : undefined;
  if (!ext) {
    return NextResponse.json(
      {
        error:
          kind === "video"
            ? "The video must be an MP4 (video/mp4)"
            : "The poster must be a JPEG, PNG or WebP image",
      },
      { status: 400 },
    );
  }
  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: "A file size is required" }, { status: 400 });
  }
  if (size > rule.maxBytes) {
    return NextResponse.json(
      { error: `The ${kind} must be ${rule.maxBytes / MB} MB or smaller` },
      { status: 400 },
    );
  }

  const path = `${kind}/${Date.now()}-${randomUUID()}.${ext}`;
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("[onboarding-upload] signed url failed", error?.message);
    return NextResponse.json({ error: "Could not prepare the upload. Try again." }, { status: 500 });
  }
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ signedUrl: data.signedUrl, path, publicUrl: pub.publicUrl });
}
