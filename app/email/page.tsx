import { Header } from "@/components/layout/header";
import { createAdminClient } from "@/lib/supabase";
import { getEmailHealth } from "@/lib/queries/email";
import { EmailHealthTable } from "@/components/email/email-health-table";
import { EmailFailureList } from "@/components/email/email-failure-list";
import { EmailSequenceCard } from "@/components/email/email-sequence-card";

export const revalidate = 60;

export default async function EmailPage() {
  const supabase = createAdminClient();
  const health = await getEmailHealth(supabase);

  return (
    <div>
      <Header title="Email" />
      <div className="p-6 space-y-8">
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Every email the product can send, and when it last sent one. A count
          of zero is the point: an email that has stopped working leaves no
          trace anywhere else, so each one stays on this list whether or not it
          has anything to show. Counts cover the last {health.windowDays} days.
          Internal ops mail (new signups, feed alerts) is not listed: it goes to
          the team inbox rather than to a user, so there is no account to record
          it against. To change what any of these say, use{" "}
          <a href="/controls/emails" className="underline">
            Controls, Email copy
          </a>
          .
        </p>

        <EmailSequenceCard sequence={health.sequence} />

        <section className="space-y-3">
          <h2
            className="text-[10px] tracking-widest uppercase"
            style={{ color: "var(--muted-foreground)" }}
          >
            Lifecycle and transactional
          </h2>
          <EmailHealthTable rows={health.rows} />
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            <strong>Silent</strong> means it should have sent by now and has
            not. <strong>Never sent</strong> means it has not sent once in the
            window. <strong>Nothing yet</strong> is not a fault: those only send
            when a user or the market does something, so an empty month is a
            fact about the month.
          </p>
        </section>

        <section className="space-y-3">
          <h2
            className="text-[10px] tracking-widest uppercase"
            style={{ color: "var(--muted-foreground)" }}
          >
            Recent failures
          </h2>
          <EmailFailureList failures={health.failures} />
        </section>

        {health.unregistered.length > 0 && (
          <section className="space-y-3">
            <h2
              className="text-[10px] tracking-widest uppercase"
              style={{ color: "var(--muted-foreground)" }}
            >
              One-off campaigns
            </h2>
            <div
              className="rounded-md overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              <table className="w-full text-sm">
                <tbody>
                  {health.unregistered.map((row) => (
                    <tr
                      key={row.campaign}
                      style={{ borderTop: "1px solid var(--border)" }}
                    >
                      <td
                        className="px-4 py-2.5 font-medium"
                        style={{ color: "var(--foreground)" }}
                      >
                        {row.campaign}
                      </td>
                      <td
                        className="px-4 py-2.5 text-right metric-number"
                        style={{ color: "var(--foreground)" }}
                      >
                        {row.sent}
                      </td>
                      <td
                        className="px-4 py-2.5 text-right"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {new Date(row.lastSent).toISOString().slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
