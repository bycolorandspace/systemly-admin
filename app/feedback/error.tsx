"use client";

import { Header } from "@/components/layout/header";
import { FeedbackNotice } from "@/components/feedback/feedback-notice";

export default function FeedbackError({ reset }: { error: Error; reset: () => void }) {
  return (
    <>
      <Header title="Feedback" />
      <FeedbackNotice kind="error" message="The feedback page failed to load." />
      <button
        type="button"
        onClick={reset}
        className="mx-6 text-sm underline"
        style={{ color: "var(--primary)" }}
      >
        Try again
      </button>
    </>
  );
}
