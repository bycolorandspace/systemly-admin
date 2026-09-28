import "server-only";
import { mainAppFetch } from "@/lib/main-app";

/**
 * The list of editable emails, owned by the main app.
 *
 * `GET /api/admin/email/copy` in the main app builds it from each sender's own
 * defaults (`lib/email/copy-registry.ts` there). This admin used to keep a
 * hand-written list instead, and by 28 September 2026 it offered three emails
 * nothing rendered and hid fourteen live ones. Reading the list keeps the
 * editor in step with what actually sends.
 */

export type EditableEmailField = {
  key: string;
  /** A JSON array of {title, description}, edited as a list. */
  json: boolean;
  /** The words the email uses when nothing is saved. */
  defaultValue: string;
  /** The saved override, or null when the email follows the default. */
  savedValue: string | null;
  updatedAt: string | null;
};

export type EditableEmail = {
  type: string;
  name: string;
  when: string;
  preview: boolean;
  testSend: boolean;
  fields: EditableEmailField[];
};

export async function fetchEditableEmails(): Promise<
  { emails: EditableEmail[]; error: null } | { emails: []; error: string }
> {
  try {
    const res = await mainAppFetch("/api/admin/email/copy");
    const json = (await res.json().catch(() => null)) as { emails?: EditableEmail[]; error?: string } | null;
    if (!res.ok || !json?.emails) {
      console.error("[email-copy] main app returned", res.status, json?.error);
      return { emails: [], error: `The main app could not list the emails (${res.status}).` };
    }
    return { emails: json.emails, error: null };
  } catch (err) {
    console.error("[email-copy] main app unreachable", err);
    return { emails: [], error: "Could not reach the main app." };
  }
}
