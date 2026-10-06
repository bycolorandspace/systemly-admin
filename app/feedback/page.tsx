import { createAdminClient } from "@/lib/supabase";
import { getFeedbackOverview } from "@/lib/queries/feedback";
import { Header } from "@/components/layout/header";
import { FeedbackDashboard } from "@/components/feedback/feedback-dashboard";
import { FeedbackNotice } from "@/components/feedback/feedback-notice";

export const revalidate = 60;

export default async function FeedbackPage() {
  const result = await getFeedbackOverview(createAdminClient());

  return (
    <>
      <Header title="Feedback" />
      {result.status === "ok" ? (
        <FeedbackDashboard overview={result.data} />
      ) : (
        <FeedbackNotice
          kind={result.status}
          message={result.status === "error" ? result.message : undefined}
        />
      )}
    </>
  );
}
