import { Header } from "@/components/layout/header";
import { TrialInviteTable } from "@/components/trials/trial-invite-table";

export const revalidate = 0;

export default function TrialsPage() {
  return (
    <div>
      <Header title="Trial links" />
      <div className="p-6">
        <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
          Each link is a signup page at /join/&lt;code&gt; that grants its tier for
          the given number of days. Users get whichever is higher, the trial tier
          or the tier they already pay for. One trial link per user, ever.
        </p>
        <TrialInviteTable />
      </div>
    </div>
  );
}
