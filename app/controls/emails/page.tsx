import { Header } from "@/components/layout/header";
import { EmailTemplatePanel } from "@/components/controls/email-template-panel";
import { fetchEditableEmails } from "@/lib/queries/email-copy";

export const dynamic = "force-dynamic";

export default async function EmailsPage() {
  const { emails, error } = await fetchEditableEmails();

  return (
    <>
      <Header title="Email Templates" />
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          <p className="text-sm text-muted-foreground">
            Every email whose words can be changed without a deploy. Each field shows what the email says now.
            Changes take effect on the next send.
          </p>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {emails.map((email) => (
            <details key={email.type} className="border rounded-lg">
              <summary className="px-4 py-3 cursor-pointer text-sm font-medium hover:bg-accent/50 rounded-lg">
                {email.name}
                <span className="ml-2 text-xs text-muted-foreground font-normal">{email.when}</span>
                {email.fields.some((f) => f.savedValue !== null) && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">· has custom copy</span>
                )}
              </summary>
              <div className="px-4 pb-4 pt-2 border-t">
                <EmailTemplatePanel email={email} />
              </div>
            </details>
          ))}
        </div>
      </div>
    </>
  );
}
