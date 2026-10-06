import { AlertTriangle, DatabaseZap } from "lucide-react";

/** Shown instead of the page when the table is missing or the read failed. */
export function FeedbackNotice({
  kind,
  message,
}: {
  kind: "missing_table" | "error";
  message?: string;
}) {
  const Icon = kind === "missing_table" ? DatabaseZap : AlertTriangle;
  return (
    <div
      role="alert"
      className="m-6 flex items-start gap-3 rounded-md px-4 py-3 text-sm"
      style={{
        background: "var(--secondary)",
        border: "1px solid var(--border)",
        color: "var(--foreground)",
      }}
    >
      <Icon
        className="w-4 h-4 mt-0.5 flex-shrink-0"
        style={{ color: kind === "error" ? "var(--destructive)" : "var(--primary)" }}
      />
      <div>
        {kind === "missing_table" ? (
          <>
            <p className="font-medium">feedback_responses table not found, push the migration.</p>
            <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
              The table is created by a migration in the main app. Once it is pushed to the
              main Supabase project, reload this page.
            </p>
          </>
        ) : (
          <p className="font-medium">{message ?? "Feedback could not be loaded."}</p>
        )}
      </div>
    </div>
  );
}
