import "server-only";

/**
 * Server-side calls from the admin dashboard to the main app.
 *
 * The main app guards its cron and admin routes with a shared bearer token,
 * CRON_SECRET (`lib/auth/cron-guard.ts` in the main app). Anyone holding that
 * token can do what those routes do: send email from our domain, rewrite
 * lifecycle email copy, run paid AI jobs, trigger auto-execution. So the token
 * is read here, on the server, and never leaves it: never a NEXT_PUBLIC_
 * variable, never a prop to a client component, never in a response body.
 *
 * `import "server-only"` makes a client component that imports this file fail
 * the build rather than ship the secret. Until 28 September 2026 the email copy
 * editor received CRON_SECRET as a prop and called the main app from the
 * browser, which serialised the token into the page HTML.
 */

export class MainAppConfigError extends Error {}

export function mainAppBaseUrl(): string {
  return process.env.MAIN_APP_URL || "http://localhost:3000";
}

/**
 * fetch() against the main app with the cron bearer token attached.
 * `path` must start with "/" and is appended to MAIN_APP_URL.
 */
export async function mainAppFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    throw new MainAppConfigError("CRON_SECRET is not configured on the admin app.");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${secret}`);

  return fetch(`${mainAppBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}
