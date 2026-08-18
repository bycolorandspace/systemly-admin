import { Header } from "@/components/layout/header";
import { OutreachTable } from "@/components/outreach/outreach-table";

export const revalidate = 0;

export default function OutreachPage() {
  return (
    <div>
      <Header title="Outreach" />
      <div className="p-6">
        <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
          One-off founder emails, sent one person at a time from
          chike@systemly.ai. Each send is stamped on the profile so nobody is
          contacted twice. Test and internal accounts are filtered out.
        </p>
        <OutreachTable />
      </div>
    </div>
  );
}
