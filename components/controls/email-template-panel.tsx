"use client";

import { useState } from "react";
import type { EditableEmail } from "@/lib/queries/email-copy";
import { ChangelogEditor } from "@/components/controls/changelog-editor";

interface Props {
  email: EditableEmail;
}

/** "body_intro" -> "Body intro". The keys are the sender's own field names. */
function labelFor(key: string): string {
  const words = key.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Edit one email's copy.
 *
 * Every field starts filled with what the email currently says: the saved
 * override if there is one, otherwise the default from the main app's sender.
 * Saving a field back to its default, or clearing it, removes the override, so
 * the email follows the code again (the main app decides that, not this form).
 *
 * Load, save, preview and test-send all go through the admin's own server
 * (`app/api/admin/email/...`), which adds the main app's CRON_SECRET there.
 * This component must never receive that token: anything passed as a prop to a
 * client component is serialised into the page HTML.
 */
export function EmailTemplatePanel({ email }: Props) {
  const initial = Object.fromEntries(
    email.fields.map((f) => [f.key, f.savedValue ?? f.defaultValue]),
  );
  const [fields, setFields] = useState<Record<string, string>>(initial);
  const [custom, setCustom] = useState<Record<string, boolean>>(
    Object.fromEntries(email.fields.map((f) => [f.key, f.savedValue !== null])),
  );
  const [saving, setSaving] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const defaults = Object.fromEntries(email.fields.map((f) => [f.key, f.defaultValue]));
  const set = (key: string, value: string) => setFields((prev) => ({ ...prev, [key]: value }));

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/email/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailType: email.type, fields }),
      });
      const json = await res.json();
      if (res.ok) {
        setCustom(
          Object.fromEntries(
            Object.entries(fields).map(([k, v]) => [k, v.trim() !== "" && v !== defaults[k]]),
          ),
        );
        setFields((prev) =>
          Object.fromEntries(
            Object.entries(prev).map(([k, v]) => [k, v.trim() === "" ? defaults[k] : v]),
          ),
        );
        setStatus(`✓ Saved. ${json.upserted} custom, ${json.reset} on default.`);
      } else {
        setStatus(`✗ ${json.error}`);
      }
    } catch (err) {
      setStatus(`✗ ${String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleSend() {
    if (!testTo) { setStatus("Enter a test email first"); return; }
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: email.type, to: testTo }),
      });
      const json = await res.json();
      setStatus(res.ok ? `✓ Sent to ${testTo}` : `✗ ${json.error}`);
    } catch (err) {
      setStatus(`✗ ${String(err)}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          Fields marked Custom override the default in code. Reset puts the default back; save to apply.
        </p>
        {email.preview && (
          <a
            href={`/api/admin/email/preview/${email.type}`}
            target="_blank"
            rel="noreferrer"
            title="Renders the saved copy, not unsaved edits"
            className="shrink-0 text-xs px-3 py-1.5 border rounded-md hover:bg-accent"
          >
            Preview saved
          </a>
        )}
      </div>

      {email.fields.map((f) => {
        const value = fields[f.key] ?? "";
        const edited = value !== defaults[f.key];
        return (
          <div key={f.key}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">
                {labelFor(f.key)}
                {custom[f.key] && (
                  <span className="ml-2 rounded px-1.5 py-0.5 text-[10px] bg-accent text-foreground">Custom</span>
                )}
              </label>
              {edited && (
                <button
                  type="button"
                  onClick={() => set(f.key, f.defaultValue)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Reset to default
                </button>
              )}
            </div>
            {f.json ? (
              <ChangelogEditor value={value || "[]"} onChange={(v) => set(f.key, v)} />
            ) : value.length > 80 || value.includes("\n") || f.defaultValue.length > 80 ? (
              <textarea
                rows={Math.min(10, Math.max(3, Math.ceil(value.length / 90) + value.split("\n").length - 1))}
                className="w-full text-sm border rounded-md p-2 resize-y font-mono bg-background"
                value={value}
                onChange={(e) => set(f.key, e.target.value)}
              />
            ) : (
              <input
                type="text"
                className="w-full text-sm border rounded-md p-2 bg-background"
                value={value}
                onChange={(e) => set(f.key, e.target.value)}
              />
            )}
          </div>
        );
      })}

      <div className="flex items-center gap-2 pt-2">
        {email.testSend && (
          <>
            <input
              type="email"
              placeholder="test@example.com"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              className="flex-1 text-sm border rounded-md p-2 bg-background"
            />
            <button onClick={handleSend} disabled={sending} className="text-sm px-3 py-1.5 border rounded-md hover:bg-accent disabled:opacity-50">
              {sending ? "Sending…" : "Send test"}
            </button>
          </>
        )}
        <button onClick={handleSave} disabled={saving} className="ml-auto text-sm px-3 py-1.5 bg-foreground text-background rounded-md hover:opacity-80 disabled:opacity-50">
          {saving ? "Saving…" : "Save copy"}
        </button>
      </div>

      {status && (
        <p className={`text-xs ${status.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>{status}</p>
      )}
    </div>
  );
}
