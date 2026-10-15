"use client";

import { useRef, useState } from "react";

type Kind = "video" | "poster";

interface OnboardingMediaCardProps {
  kind: Kind;
  label: string;
  configKey: string;
  initialUrl: string;
  /** The built-in file the main app ships, written back by "Reset to built-in". */
  defaultUrl: string;
  /** Base URL of the main app, used to show a built-in (relative) file in the preview. */
  mainAppUrl: string;
  accept: string;
  helpText?: string;
}

function previewSrc(url: string, mainAppUrl: string): string {
  if (url.startsWith("/") && mainAppUrl.startsWith("http")) {
    return `${mainAppUrl.replace(/\/$/, "")}${url}`;
  }
  return url;
}

async function saveUrl(configKey: string, value: string): Promise<string | null> {
  const res = await fetch("/api/admin/set-config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: configKey, value }),
  });
  if (res.ok) return null;
  const body = (await res.json().catch(() => null)) as { error?: unknown } | null;
  return typeof body?.error === "string" ? body.error : `HTTP ${res.status}`;
}

/** Sends the file straight to Supabase Storage so it never goes through a size-capped API route. */
function putFile(signedUrl: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("cacheControl", "31536000");
    form.append("", file);
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (HTTP ${xhr.status})`));
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
    xhr.send(form);
  });
}

export function OnboardingMediaCard({
  kind,
  label,
  configKey,
  initialUrl,
  defaultUrl,
  mainAppUrl,
  accept,
  helpText,
}: OnboardingMediaCardProps) {
  const [url, setUrl] = useState(initialUrl);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    setBusy(true);
    setError(null);
    setMessage(null);
    setProgress(0);
    try {
      const res = await fetch("/api/admin/onboarding-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, fileName: file.name, contentType: file.type, size: file.size }),
      });
      const body = (await res.json().catch(() => null)) as
        | { signedUrl?: string; publicUrl?: string; error?: string }
        | null;
      if (!res.ok || !body?.signedUrl || !body.publicUrl) {
        setError(body?.error ?? `HTTP ${res.status}`);
        return;
      }
      await putFile(body.signedUrl, file, setProgress);
      const problem = await saveUrl(configKey, body.publicUrl);
      if (problem) {
        setError(`Uploaded, but saving the URL failed: ${problem}`);
        return;
      }
      setUrl(body.publicUrl);
      setMessage("Replaced. New visitors get it within a minute or so.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function reset() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const problem = await saveUrl(configKey, defaultUrl);
      if (problem) {
        setError(problem);
        return;
      }
      setUrl(defaultUrl);
      setMessage("Reset to the built-in file.");
    } finally {
      setBusy(false);
    }
  }

  const src = previewSrc(url, mainAppUrl);
  const isBuiltIn = url === defaultUrl;

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start gap-4">
        <div
          className="shrink-0 rounded overflow-hidden flex items-center justify-center"
          style={{ width: 72, height: 128, background: "var(--secondary)" }}
        >
          {kind === "video" ? (
            <video src={src} muted playsInline controls preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{label}</p>
          <p className="text-xs mt-0.5 break-all font-mono" style={{ color: "var(--muted-foreground)" }}>
            {url} {isBuiltIn ? "(built-in)" : ""}
          </p>
          {helpText && (
            <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>{helpText}</p>
          )}
          <div className="flex items-center gap-2 mt-3">
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
              }}
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-50"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              {progress !== null ? `Uploading ${progress}%` : `Replace ${kind}`}
            </button>
            <button
              onClick={reset}
              disabled={busy || isBuiltIn}
              className="px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-50"
              style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}
            >
              Reset to built-in
            </button>
          </div>
          {progress !== null && (
            <div className="mt-2 h-1.5 rounded" style={{ background: "var(--secondary)" }}>
              <div className="h-1.5 rounded" style={{ width: `${progress}%`, background: "var(--primary)" }} />
            </div>
          )}
          {message && (
            <p className="text-xs mt-2" style={{ color: "var(--success)" }}>{message}</p>
          )}
          {error && (
            <p role="alert" className="text-xs mt-2" style={{ color: "var(--destructive)" }}>{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
