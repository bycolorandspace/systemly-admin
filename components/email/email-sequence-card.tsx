import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { EmailHealth } from "@/lib/queries/email";

/**
 * The one derived check on this page.
 *
 * Every other row answers "did this send". This answers "did the thing that
 * starts three of them still work", which is a different question and the one
 * that was wrong for a month. The founder check-in follows every welcome by
 * two hours with no condition attached, so welcomes with no check-ins behind
 * them can only mean the onboarding event never reached the queue.
 */
export function EmailSequenceCard({
  sequence,
}: {
  sequence: EmailHealth["sequence"];
}) {
  const { welcomes7d, checkins7d, broken } = sequence;
  const Icon = broken ? AlertTriangle : CheckCircle2;
  const colour = broken ? "#e05252" : "#0f9d58";

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-md"
      style={{
        background: "var(--card)",
        border: `1px solid ${broken ? colour : "var(--border)"}`,
      }}
    >
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colour }} />
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          {broken
            ? "The delayed sequence is not starting"
            : "The delayed sequence is starting"}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
          {welcomes7d} welcome{welcomes7d === 1 ? "" : "s"} and {checkins7d}{" "}
          founder check-in{checkins7d === 1 ? "" : "s"} in the last 7 days. The
          check-in follows every welcome by two hours, so these two numbers
          track each other. If welcomes keep climbing and check-ins stay at
          zero, the onboarding event is not reaching the queue and the two
          day-3 nudges are gone with it.
        </p>
      </div>
    </div>
  );
}
